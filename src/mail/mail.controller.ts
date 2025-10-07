import { Controller, Post, Body, Get } from '@nestjs/common';
import { MailService } from './mail.service';
import { QueueService } from '../queue/queue.service';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly queueService: QueueService,
  ) {}

  @Post('send-booking-confirmation')
  async sendBookingConfirmation(@Body() data: any) {
    const { email, bookingData } = data;
    await this.queueService.sendBookingConfirmation(email, bookingData);
    return { message: 'Booking confirmation email queued successfully' };
  }

  @Post('send-booking-reminder')
  async sendBookingReminder(@Body() data: any) {
    const { email, bookingData, delayMs } = data;
    await this.queueService.sendBookingReminder(email, bookingData, delayMs);
    return { message: 'Booking reminder email queued successfully' };
  }

  @Post('send-password-reset')
  async sendPasswordReset(@Body() data: any) {
    const { email, resetLink } = data;
    await this.queueService.sendPasswordReset(email, resetLink);
    return { message: 'Password reset email queued successfully' };
  }

  @Post('send-welcome')
  async sendWelcome(@Body() data: any) {
    const { email, userName } = data;
    await this.queueService.sendWelcomeEmail(email, userName);
    return { message: 'Welcome email queued successfully' };
  }

  @Post('send-test-email')
  async sendTestEmail(@Body() data: any) {
    const { email, subject, template, context } = data;
    const result = await this.mailService.sendMail({
      to: email,
      subject: subject || 'Test Email',
      template: template || 'welcome',
      context: context || { userName: 'Test User' },
    });
    return { message: result ? 'Test email sent successfully' : 'Failed to send test email' };
  }

  @Get('queue-stats')
  async getQueueStats() {
    return await this.queueService.getQueueStats();
  }

  @Post('clear-queue')
  async clearQueue() {
    await this.queueService.clearQueue();
    return { message: 'Queue cleared successfully' };
  }

  @Post('pause-queue')
  async pauseQueue() {
    await this.queueService.pauseQueue();
    return { message: 'Queue paused successfully' };
  }

  @Post('resume-queue')
  async resumeQueue() {
    await this.queueService.resumeQueue();
    return { message: 'Queue resumed successfully' };
  }

  // Route test gửi mail trực tiếp để kiểm tra Gmail App Password
  @Get('test')
  async sendTestMail() {
    const result = await this.mailService.sendMail({
      to: 'ducanhinformaitiontechnology@gmail.com',
      subject: 'Test Email from Movie Booking App',
      text: 'Xin chào Đức Anh! Đây là email thử nghiệm gửi từ hệ thống Movie Booking App.',
    });
    return { message: result ? 'Test email sent successfully' : 'Failed to send test email' };
  }
}
