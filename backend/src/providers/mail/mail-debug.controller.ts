import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { QueueService } from '../queue/queue.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog } from 'src/shared/schemas/email-log.entity';

@ApiTags('Mail Debug')
@Controller('mail/debug')
export class MailDebugController {
  constructor(
    private readonly mailService: MailService,
    private readonly queueService: QueueService,
    @InjectRepository(EmailLog)
    private readonly emailLogRepo: Repository<EmailLog>,
  ) {}

  @Get('test-connection')
  @ApiOperation({ summary: 'Kiểm tra kết nối mail server' })
  async testConnection() {
    
    const host = process.env.MAIL_HOST || 'localhost';
    const port = process.env.MAIL_PORT || '1025';
    const user = process.env.MAIL_USER || '';
    const secure = process.env.MAIL_SECURE === 'true' || process.env.MAIL_SECURE === '1';

    return {
      config: {
        host,
        port: Number(port),
        secure,
        user: user ? '***' : 'NOT SET',
        hasPassword: !!process.env.MAIL_PASS,
      },
      message: 'Kiểm tra log để xem mail server connection status',
      checkPoints: [
        'Xem console log: "Mail server connected successfully"',
        'Nếu có lỗi: Kiểm tra MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS trong .env',
      ],
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Xem lịch sử email gần đây (từ database)' })
  async getEmailLogs() {
    const logs = await this.emailLogRepo.find({
      order: { sentAt: 'DESC' },
      take: 20,
    });

    const stats = {
      total: logs.length,
      sent: logs.filter(l => l.status === 'SENT').length,
      failed: logs.filter(l => l.status === 'FAILED').length,
      pending: logs.filter(l => l.status === 'PENDING').length,
    };

    return {
      stats,
      recent: logs.map(log => ({
        id: log.id,
        to: log.to,
        subject: log.subject,
        type: log.type,
        status: log.status,
        sentAt: log.sentAt,
        error: log.error,
        messageId: log.messageId,
      })),
    };
  }

  @Post('simple-test')
  @ApiOperation({ 
    summary: 'Test email đơn giản nhất',
    description: 'Gửi email text đơn giản, không cần template'
  })
  async simpleTest(@Body() body: { to: string }) {
    try {
      await this.mailService.send({
        to: body.to,
        subject: 'Test Email từ Cinema System',
        html: '<h1>Test Email</h1><p>Nếu bạn nhận được email này, hệ thống email đang hoạt động!</p>',
        text: 'Test Email - Nếu bạn nhận được email này, hệ thống email đang hoạt động!',
      });
      return {
        success: true,
        message: 'Email đã được gửi. Kiểm tra inbox (và spam folder).',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: 'Kiểm tra cấu hình email trong .env',
      };
    }
  }

  @Get('queue-status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái queue và Redis' })
  async getQueueStatus() {
    try {
      const stats = await this.queueService.getQueueStats();
      return {
        redis: 'Connected',
        queue: 'Active',
        stats,
      };
    } catch (error) {
      return {
        redis: 'Disconnected',
        queue: 'Inactive',
        error: error.message,
        message: 'Redis không chạy hoặc không kết nối được. Chạy: redis-server',
      };
    }
  }
}

