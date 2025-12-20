import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { TheatersService } from '../../theaters/services/theaters.service';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly theatersService: TheatersService,
  ) {}

  @Get('theaters')
  @ApiOperation({ summary: 'Lấy danh sách rạp để chọn chat' })
  async getTheaters(@Query('search') search?: string) {
    return await this.theatersService.findAll({
      page: 1,
      limit: 100,
      search,
    });
  }

  @Get('theaters/:theaterId/staff')
  @ApiOperation({ summary: 'Lấy thông tin nhân viên được gán cho rạp' })
  async getStaffByTheater(@Param('theaterId') theaterId: number) {
    return await this.chatService.getStaffByTheater(theaterId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lấy danh sách cuộc trò chuyện của user' })
  async getUserConversations(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return await this.chatService.getUserConversations(userId);
  }

  @Get('conversations/staff')
  @ApiOperation({ summary: 'Lấy danh sách cuộc trò chuyện của staff' })
  async getStaffConversations(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return await this.chatService.getStaffConversations(userId);
  }

  @Get('messages/:theaterId')
  @ApiOperation({ summary: 'Lấy tin nhắn của cuộc trò chuyện' })
  async getMessages(
    @Request() req,
    @Param('theaterId') theaterId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('targetUserId') targetUserId?: number,
  ) {
    const userId = req.user.userId || req.user.sub;
    const theaterIdNumber = Number(theaterId);
    const targetUserIdNumber = targetUserId ? Number(targetUserId) : undefined;
    const user = await this.chatService['userService'].findById(userId);
    const isStaff = (user.roles || []).includes('ROLE_EMPLOYEE') || 
                    (user.roles || []).includes('ROLE_ADMIN');
    
    // Nếu là staff và có targetUserId, lấy messages của user đó
    const actualUserId = (isStaff && targetUserIdNumber) ? targetUserIdNumber : userId;
    return await this.chatService.getMessages(actualUserId, theaterIdNumber, page, limit);
  }

  @Post('messages/:theaterId/read')
  @ApiOperation({ summary: 'Đánh dấu tin nhắn đã đọc' })
  async markAsRead(
    @Request() req,
    @Param('theaterId') theaterId: number,
  ) {
    const userId = req.user.userId || req.user.sub;
    const user = await this.chatService['userService'].findById(userId);
    
    const isStaff = (user.roles || []).includes('ROLE_EMPLOYEE');
    await this.chatService.markAsRead(userId, Number(theaterId), isStaff);
    return { success: true };
  }

  // Admin endpoints
  @Get('admin/conversations')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Admin: Lấy tất cả cuộc trò chuyện' })
  async getAllConversations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('search') search?: string,
    @Query('theaterId') theaterId?: number,
    @Query('userId') userId?: number,
    @Query('staffId') staffId?: number,
  ) {
    return await this.chatService.getAllConversations({
      page,
      limit,
      search,
      theaterId: theaterId ? Number(theaterId) : undefined,
      userId: userId ? Number(userId) : undefined,
      staffId: staffId ? Number(staffId) : undefined,
    });
  }

  @Get('admin/conversations/:conversationId/messages')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Admin: Lấy tin nhắn của một cuộc trò chuyện' })
  async getMessagesByConversationId(
    @Param('conversationId') conversationId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return await this.chatService.getMessagesByConversationId(conversationId, page, limit);
  }
}

