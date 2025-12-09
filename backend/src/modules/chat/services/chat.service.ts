import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ChatRepository } from '../repositories/chat.repository';
import { UserService } from '../../users/services/user.service';
import { TheatersService } from '../../theaters/services/theaters.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepo: ChatRepository,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => TheatersService))
    private readonly theatersService: TheatersService,
  ) {}

  async sendMessage(data: {
    userId: number;
    theaterId: number;
    message: string;
    isFromStaff: boolean;
    staffId?: number | null;
  }) {
    // Tìm hoặc tạo conversation
    const conversation = await this.chatRepo.findOrCreateConversation(
      data.userId,
      data.theaterId,
      data.staffId,
    );

    // Nếu chưa có staff, tìm staff được gán cho rạp này
    if (!data.isFromStaff && !conversation.staffId) {
      const staffList = await this.getStaffByTheater(data.theaterId);
      if (staffList && staffList.length > 0) {
        const staff = staffList[0];
        conversation.staffId = staff.id;
        await this.chatRepo['conversationRepo'].save(conversation);
        data.staffId = staff.id;
      }
    }

    // Tạo message
    const message = await this.chatRepo.createMessage({
      userId: data.userId,
      staffId: data.staffId || conversation.staffId || null,
      theaterId: data.theaterId,
      message: data.message,
      isFromStaff: data.isFromStaff,
    });

    // Cập nhật conversation
    await this.chatRepo.updateConversationLastMessage(
      conversation.id,
      data.message,
    );

    // Tăng unread count
    await this.chatRepo.incrementUnreadCount(
      conversation.id,
      data.isFromStaff,
    );

    return message;
  }

  async getMessages(
    userId: number,
    theaterId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    const offset = (page - 1) * limit;
    const messages = await this.chatRepo.findMessagesByConversation(
      userId,
      theaterId,
      limit,
      offset,
    );

    return messages.reverse(); // Đảo ngược để hiển thị từ cũ đến mới
  }

  async markAsRead(userId: number, theaterId: number, isStaff: boolean) {
    await this.chatRepo.markMessagesAsRead(userId, theaterId, isStaff);
  }

  async getUserConversations(userId: number) {
    return await this.chatRepo.findUserConversations(userId);
  }

  async getStaffConversations(staffId: number) {
    return await this.chatRepo.findStaffConversations(staffId);
  }

  async getStaffByTheater(theaterId: number) {
    const theater = await this.theatersService.findOne(theaterId);
    if (!theater) {
      throw new NotFoundException('Theater not found');
    }

    // Lấy tất cả users và filter
    const allUsers = await this.userService.findAll();
    return allUsers
      .filter((user: any) => {
        const hasEmployeeRole = (user.roles || []).includes('ROLE_EMPLOYEE');
        return hasEmployeeRole && user.theaterId === theaterId;
      });
  }

  async getAllConversations(params?: {
    page?: number;
    limit?: number;
    search?: string;
    theaterId?: number;
    userId?: number;
    staffId?: number;
  }) {
    return await this.chatRepo.findAllConversations(params);
  }

  async getMessagesByConversationId(
    conversationId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    const offset = (page - 1) * limit;
    const messages = await this.chatRepo.findMessagesByConversationId(
      conversationId,
      limit,
      offset,
    );
    return messages.reverse();
  }
}

