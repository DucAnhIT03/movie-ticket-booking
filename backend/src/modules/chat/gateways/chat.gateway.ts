import {
  Logger,
} from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from '../services/chat.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../../../shared/schemas/users.entity';
import { ChatMessage } from '../../../shared/schemas/chat-message.entity';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
  theaterId?: number;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<number, Set<string>>(); // userId -> Set of socketIds
  private socketToUser = new Map<string, { userId: number; theaterId?: number }>(); // socketId -> user info

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided for socket ${client.id}`);
        client.disconnect();
        return;
      }

      let payload;
      try {
        payload = this.jwtService.verify(token);
      } catch (error) {
        this.logger.error(`Token verification failed: ${error.message}`);
        client.disconnect();
        return;
      }

      const userId = payload.sub || payload.userId;
      
      if (!userId) {
        this.logger.warn(`Connection rejected: Invalid token payload for socket ${client.id}`);
        client.disconnect();
        return;
      }

      const user = await this.usersRepo.findOne({
        where: { id: userId },
        relations: ['roles', 'roles.role', 'theater'],
      } as any);

      if (!user) {
        this.logger.warn(`Connection rejected: User not found for socket ${client.id}`);
        client.disconnect();
        return;
      }

      const roleNames = (user.roles || [])
        .map((ur) => ur.role?.roleName)
        .filter(Boolean);

      // Ưu tiên gán đúng vai trò nhân viên nếu user có nhiều role
      const hasEmployeeRole = roleNames.includes('ROLE_EMPLOYEE');
      const hasAdminRole = roleNames.includes('ROLE_ADMIN');
      const primaryRole = hasEmployeeRole
        ? 'ROLE_EMPLOYEE'
        : hasAdminRole
          ? 'ROLE_ADMIN'
          : roleNames[0] || 'ROLE_USER';

      client.userId = userId;
      client.userRole = primaryRole;
      client.theaterId = user.theaterId || undefined;

      // Lưu thông tin socket
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.add(client.id);
      }
      this.socketToUser.set(client.id, {
        userId,
        theaterId: user.theaterId || undefined,
      });

      // Join room theo theaterId nếu là staff
      if (user.theaterId) {
        client.join(`theater:${user.theaterId}`);
      }

      // Join room theo userId
      client.join(`user:${userId}`);

      this.logger.log(`User ${userId} (${roleNames[0] || 'ROLE_USER'}) connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userInfo = this.socketToUser.get(client.id);
    if (userInfo) {
      const userSockets = this.connectedUsers.get(userInfo.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userInfo.userId);
        }
      }
      this.socketToUser.delete(client.id);
      this.logger.log(`User ${userInfo.userId} disconnected`);
    }
  }

  /**
   * Emit event để thông báo user bị khóa tài khoản
   * @param userId ID của user bị khóa
   */
  notifyAccountBlocked(userId: number) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets && userSockets.size > 0) {
      // Emit đến room của user
      this.server.to(`user:${userId}`).emit('account_blocked', {
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
        timestamp: new Date().toISOString(),
      });
      
      // Disconnect tất cả sockets của user này
      userSockets.forEach((socketId) => {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      });

      // Clean up
      this.connectedUsers.delete(userId);
      userSockets.forEach((socketId) => {
        this.socketToUser.delete(socketId);
      });

      this.logger.log(`User ${userId} has been blocked and disconnected from all sessions`);
    } else {
      this.logger.log(`User ${userId} was blocked but has no active connections`);
    }
  }

  @SubscribeMessage('join_theater')
  async handleJoinTheater(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { theaterId: number },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    client.join(`theater:${data.theaterId}`);
    this.socketToUser.set(client.id, {
      userId: client.userId,
      theaterId: data.theaterId,
    });

    this.logger.log(`User ${client.userId} joined theater ${data.theaterId}`);
    return { success: true, theaterId: data.theaterId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { theaterId: number; message: string; imageUrl?: string },
  ) {
    // Nếu client.userId không có, thử authenticate lại
    if (!client.userId) {
      this.logger.warn(`Client ${client.id} has no userId, attempting to re-authenticate`);
      
      try {
        const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) {
          this.logger.warn(`No token found for client ${client.id}`);
          return { error: 'Unauthorized' };
        }

        const payload = this.jwtService.verify(token);
        const userId = payload.sub || payload.userId;
        
        if (!userId) {
          this.logger.warn(`Invalid token payload for client ${client.id}`);
          return { error: 'Unauthorized' };
        }

        const user = await this.usersRepo.findOne({
          where: { id: userId },
          relations: ['roles', 'roles.role', 'theater'],
        } as any);

        if (!user) {
          this.logger.warn(`User not found for client ${client.id}`);
          return { error: 'Unauthorized' };
        }

        const roleNames = (user.roles || [])
          .map((ur) => ur.role?.roleName)
          .filter(Boolean);

        const hasEmployeeRole = roleNames.includes('ROLE_EMPLOYEE');
        const hasAdminRole = roleNames.includes('ROLE_ADMIN');
        const primaryRole = hasEmployeeRole
          ? 'ROLE_EMPLOYEE'
          : hasAdminRole
            ? 'ROLE_ADMIN'
            : roleNames[0] || 'ROLE_USER';

        client.userId = userId;
        client.userRole = primaryRole;
        client.theaterId = user.theaterId || undefined;

        this.logger.log(`Re-authenticated client ${client.id} as user ${userId}`);
      } catch (error) {
        this.logger.error(`Re-authentication failed for client ${client.id}: ${error.message}`);
        return { error: 'Unauthorized' };
      }
    }

    // Đảm bảo userId tồn tại sau khi re-authenticate
    if (!client.userId) {
      this.logger.error(`Client ${client.id} still has no userId after re-authentication`);
      return { error: 'Unauthorized' };
    }

    const currentUserId = client.userId; // Lưu vào biến để TypeScript hiểu

    try {
      const isStaff =
        client.userRole === 'ROLE_EMPLOYEE' || client.userRole === 'ROLE_ADMIN';
      const staffId = isStaff ? currentUserId : null;

      // Nếu là staff, cần tìm conversation để lấy userId
      let targetUserId = currentUserId;
      if (isStaff) {
        const conversations = await this.chatService.getStaffConversations(currentUserId);
        const conversation = conversations.find((c: any) => c.theaterId === data.theaterId);
        if (conversation) {
          targetUserId = conversation.userId;
        }
      }

      const message = await this.chatService.sendMessage({
        userId: targetUserId,
        theaterId: data.theaterId,
        message: data.message,
        isFromStaff: isStaff,
        staffId,
        imageUrl: data.imageUrl,
      });

      // Load message với relations
      const fullMessage = await this.messageRepo.findOne({
        where: { id: message.id },
        relations: ['user', 'staff', 'theater'],
      } as any);

      // Gửi message đến user/staff - tránh duplicate:
      // - User nhận qua room user:<id>
      // - Staff nhận qua room theater:<theaterId> (đã join khi connect)
      if (!isStaff) {
        this.server.to(`user:${targetUserId}`).emit('new_message', fullMessage);
        this.server.to(`theater:${data.theaterId}`).emit('new_message', fullMessage);
      } else {
        // Staff gửi: user nhận ở room user:<id>, các staff (kể cả người gửi) nhận ở room theater:<id>
        this.server.to(`user:${targetUserId}`).emit('new_message', fullMessage);
        this.server.to(`theater:${data.theaterId}`).emit('new_message', fullMessage);
      }

      return { success: true, message: fullMessage };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { theaterId: number },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const isStaff = client.userRole === 'ROLE_EMPLOYEE';
    await this.chatService.markAsRead(client.userId, data.theaterId, isStaff);
    return { success: true };
  }
}

