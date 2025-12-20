import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../../../shared/schemas/chat-message.entity';
import { ChatConversation } from '../../../shared/schemas/chat-conversation.entity';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(ChatConversation)
    private readonly conversationRepo: Repository<ChatConversation>,
  ) {}

  async createMessage(data: {
    userId: number;
    staffId?: number | null;
    theaterId: number;
    message: string;
    isFromStaff: boolean;
    imageUrl?: string;
  }): Promise<ChatMessage> {
    const message = this.messageRepo.create(data);
    return await this.messageRepo.save(message);
  }

  async findMessagesByConversation(
    userId: number,
    theaterId: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    return await this.messageRepo.find({
      where: { userId, theaterId },
      relations: ['user', 'staff'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findOrCreateConversation(
    userId: number,
    theaterId: number,
    staffId?: number | null,
  ): Promise<ChatConversation> {
    let conversation = await this.conversationRepo.findOne({
      where: { userId, theaterId },
      relations: ['user', 'staff', 'theater'],
    });

    if (!conversation) {
      conversation = this.conversationRepo.create({
        userId,
        theaterId,
        staffId: staffId || null,
        isActive: true,
        userUnreadCount: 0,
        staffUnreadCount: 0,
      });
      conversation = await this.conversationRepo.save(conversation);
    }

    const result = await this.conversationRepo.findOne({
      where: { id: conversation.id },
      relations: ['user', 'staff', 'theater'],
    });
    
    if (!result) {
      throw new Error('Failed to create conversation');
    }
    
    return result;
  }

  async updateConversationLastMessage(
    conversationId: number,
    lastMessage: string,
  ): Promise<void> {
    await this.conversationRepo.update(conversationId, {
      lastMessage,
      lastMessageAt: new Date(),
    });
  }

  async incrementUnreadCount(
    conversationId: number,
    isStaff: boolean,
  ): Promise<void> {
    // Nếu staff gửi thì tăng unread cho user, ngược lại tăng cho staff
    const field = isStaff ? 'userUnreadCount' : 'staffUnreadCount';
    await this.conversationRepo.increment({ id: conversationId }, field, 1);
  }

  async markMessagesAsRead(
    userId: number,
    theaterId: number,
    isStaff: boolean,
  ): Promise<void> {
    await this.messageRepo.update(
      {
        userId,
        theaterId,
        isFromStaff: isStaff,
        isRead: false,
      },
      { isRead: true },
    );

    const conversation = await this.conversationRepo.findOne({
      where: { userId, theaterId },
    });

    if (conversation) {
      if (isStaff) {
        await this.conversationRepo.update(conversation.id, {
          staffUnreadCount: 0,
        });
      } else {
        await this.conversationRepo.update(conversation.id, {
          userUnreadCount: 0,
        });
      }
    }
  }

  async findUserConversations(userId: number): Promise<ChatConversation[]> {
    return await this.conversationRepo.find({
      where: { userId, isActive: true },
      relations: ['theater', 'staff'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  async findStaffConversations(staffId: number): Promise<ChatConversation[]> {
    return await this.conversationRepo.find({
      where: { staffId, isActive: true },
      relations: ['user', 'theater'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  async findTheaterConversations(theaterId: number): Promise<ChatConversation[]> {
    return await this.conversationRepo.find({
      where: { theaterId, isActive: true },
      relations: ['user', 'staff', 'theater'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  async findAllConversations(params?: {
    page?: number;
    limit?: number;
    search?: string;
    theaterId?: number;
    userId?: number;
    staffId?: number;
  }): Promise<{ items: ChatConversation[]; total: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const query = this.conversationRepo.createQueryBuilder('conv')
      .leftJoinAndSelect('conv.user', 'user')
      .leftJoinAndSelect('conv.staff', 'staff')
      .leftJoinAndSelect('conv.theater', 'theater')
      .where('conv.isActive = :isActive', { isActive: true });

    if (params?.theaterId) {
      query.andWhere('conv.theaterId = :theaterId', { theaterId: params.theaterId });
    }

    if (params?.userId) {
      query.andWhere('conv.userId = :userId', { userId: params.userId });
    }

    if (params?.staffId) {
      query.andWhere('conv.staffId = :staffId', { staffId: params.staffId });
    }

    if (params?.search) {
      query.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search OR theater.name LIKE :search)',
        { search: `%${params.search}%` }
      );
    }

    query.orderBy('conv.lastMessageAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async findMessagesByConversationId(
    conversationId: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      return [];
    }

    return await this.messageRepo.find({
      where: { userId: conversation.userId, theaterId: conversation.theaterId },
      relations: ['user', 'staff'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}

