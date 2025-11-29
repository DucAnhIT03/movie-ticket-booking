import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { QueueService } from '../queue/queue.service';
import { AdminNotificationCategory, AdminSendEmailDto } from './dto/admin-send-email.dto';
import { EmailType } from './constants/email.constants';

@ApiTags('Admin Emails')
@ApiBearerAuth('jwt')
@Controller('admin/emails')
export class AdminEmailController {
  constructor(private readonly queueService: QueueService) {}

  @Post('send')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Gửi email/thông báo thủ công tới người dùng',
    description: 'Cho phép admin gửi email đến 1 hoặc nhiều người dùng từ giao diện quản trị.',
  })
  @ApiBody({
    schema: {
      example: {
        to: 'user@example.com',
        recipients: ['another@example.com'],
        subject: 'Thông báo bảo trì hệ thống',
        message: 'Hệ thống sẽ bảo trì vào 22:00 hôm nay. Vui lòng sắp xếp công việc phù hợp.',
        notificationType: 'SYSTEM',
      },
    },
  })
  async sendAdminEmail(@Body() body: AdminSendEmailDto) {
    const recipients = this.resolveRecipients(body);

    if (recipients.length === 0) {
      throw new BadRequestException('At least one recipient email is required');
    }

    const queueJobs = recipients.map((email) =>
      this.queueService.enqueueMail({
        to: email,
        subject: body.subject,
        type: EmailType.ADMIN_NOTIFICATION,
        data: {
          to: email,
          subject: body.subject,
          message: body.message,
          notificationType: body.notificationType ?? AdminNotificationCategory.GENERAL,
          date: new Date(),
        },
      }),
    );

    const results = await Promise.allSettled(queueJobs);
    const success = results.filter((res) => res.status === 'fulfilled').length;
    const failed = recipients.length - success;

    return {
      total: recipients.length,
      success,
      failed,
      message: failed === 0 ? 'All emails queued successfully' : 'Some emails failed to queue. Check server logs for details.',
    };
  }

  private resolveRecipients(body: AdminSendEmailDto): string[] {
    const recipients = new Set<string>();

    const pushEmail = (email?: string) => {
      if (!email) return;
      const trimmed = email.trim();
      if (trimmed.length === 0) return;
      recipients.add(trimmed.toLowerCase());
    };

    pushEmail(body.to);
    body.recipients?.forEach(pushEmail);

    return Array.from(recipients);
  }
}




