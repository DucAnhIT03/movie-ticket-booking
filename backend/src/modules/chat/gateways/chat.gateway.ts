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

      client.userId = userId;
      client.userRole = roleNames[0] || 'ROLE_USER';
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
    @MessageBody() data: { theaterId: number; message: string },
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

        client.userId = userId;
        client.userRole = roleNames[0] || 'ROLE_USER';
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
      const isStaff = client.userRole === 'ROLE_EMPLOYEE';
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
      });

      // Load message với relations
      const fullMessage = await this.messageRepo.findOne({
        where: { id: message.id },
        relations: ['user', 'staff', 'theater'],
      } as any);

      // Gửi message đến user
      if (!isStaff) {
        this.server.to(`user:${targetUserId}`).emit('new_message', fullMessage);
        
        // Tìm staff của theater và gửi cho họ
        const staffList = await this.chatService.getStaffByTheater(data.theaterId);
        if (staffList && staffList.length > 0) {
          const staff = staffList[0];
          this.server.to(`user:${staff.id}`).emit('new_message', fullMessage);
        }
        this.server.to(`theater:${data.theaterId}`).emit('new_message', fullMessage);
      } else {
        // Nếu là staff gửi, gửi cho user và cho chính staff đó
        this.server.to(`user:${targetUserId}`).emit('new_message', fullMessage);
        this.server.to(`user:${client.userId}`).emit('new_message', fullMessage);
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

