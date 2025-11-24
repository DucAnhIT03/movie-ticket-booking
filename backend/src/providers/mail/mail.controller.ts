import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import type { SendMailPayload } from './mail.service';
import { QueueService } from '../queue/queue.service';
import {
  BookingConfirmationEmailDto,
  BookingInvoiceEmailDto,
  RegistrationEmailDto,
  PasswordResetEmailDto,
  WelcomeEmailDto,
  VerificationOtpEmailDto,
  ShowtimeReminderEmailDto,
  PromotionNotificationEmailDto,
  FestivalNotificationEmailDto,
} from './dto/email.dto';

@ApiTags('Mail & Queue')
@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly queueService: QueueService,
  ) {}


  @Post('send')
  @ApiOperation({ 
    summary: 'Gửi email ngay lập tức (không qua queue)',
    description: 'Test email trực tiếp, không cần Redis. Dùng để debug.'
  })
  @ApiBody({ schema: { example: { to: 'user@example.com', subject: 'Hello', html: '<b>Hi</b>', text: 'Hi', type: 'WELCOME', data: { userName: 'John' } } } })
  @ApiOkResponse({ schema: { example: { ok: true, message: 'Email sent successfully' } } })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async sendNow(@Body() body: SendMailPayload): Promise<{ ok: boolean; message?: string }> {
    try {
      await this.mailService.send(body);
      return { ok: true, message: 'Email sent successfully' };
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to send email' };
    }
  }

  
  @Post('queue')
  @ApiOperation({ summary: 'Đưa email vào hàng đợi (BullMQ)' })
  @ApiBody({ schema: { example: { to: 'user@example.com', subject: 'Welcome', type: 'WELCOME', data: { userName: 'John' } } } })
  @ApiOkResponse({ schema: { example: { jobId: '123' } } })
  async enqueue(@Body() body: SendMailPayload): Promise<{ jobId?: string }> {
    const jobId = await this.queueService.enqueueMail(body);
    return { jobId };
  }

 
  @Get('stats')
  @ApiOperation({ 
    summary: 'Xem thống kê hàng đợi email',
    description: 'Kiểm tra số lượng email đang chờ, đã gửi, thất bại'
  })
  async getStats() {
    try {
      const stats = await this.queueService.getQueueStats();
      return {
        ...stats,
        message: stats.failed > 0 ? `Có ${stats.failed} email thất bại. Xem log để biết chi tiết.` : 'All good!'
      };
    } catch (error) {
      return { 
        error: 'Cannot connect to queue. Is Redis running?',
        message: error.message 
      };
    }
  }


  @Post('retry')
  @ApiOperation({ summary: 'Thử gửi lại các job thất bại' })
  async retryFailed(): Promise<{ ok: boolean }> {
    await this.queueService.retryFailedJobs();
    return { ok: true };
  }

  
  @Post('clean')
  @ApiOperation({ summary: 'Dọn dẹp job cũ theo thời gian grace (ms)' })
  async cleanJobs(@Query('grace') grace: string): Promise<{ ok: boolean }> {
    const graceMs = grace ? parseInt(grace, 10) : 24 * 3600 * 1000;
    await this.queueService.cleanJobs(graceMs);
    return { ok: true };
  }

  
  @Post('test/booking-confirmation')
  @ApiOperation({ summary: 'Test: xếp hàng email xác nhận đặt vé' })
  async testBookingConfirmation(@Body() data: BookingConfirmationEmailDto) {
    const jobId = await this.queueService.enqueueBookingConfirmationEmail(data);
    return { jobId, message: 'Booking confirmation email queued' };
  }

  @Post('test/booking-invoice')
  @ApiOperation({ summary: 'Test: xếp hàng email hóa đơn đặt vé' })
  async testBookingInvoice(@Body() data: BookingInvoiceEmailDto) {
    const jobId = await this.queueService.enqueueBookingInvoiceEmail(data);
    return { jobId, message: 'Booking invoice email queued' };
  }

  @Post('test/welcome')
  @ApiOperation({ summary: 'Test: xếp hàng email chào mừng' })
  async testWelcomeEmail(@Body() data: WelcomeEmailDto) {
    const jobId = await this.queueService.enqueueWelcomeEmail(data);
    return { jobId, message: 'Welcome email queued' };
  }

  @Post('test/registration')
  @ApiOperation({ summary: 'Test: xếp hàng email xác nhận đăng ký' })
  async testRegistrationEmail(@Body() data: RegistrationEmailDto) {
    const jobId = await this.queueService.enqueueRegistrationEmail(data);
    return { jobId, message: 'Registration email queued' };
  }

  @Post('test/password-reset')
  @ApiOperation({ summary: 'Test: xếp hàng email đặt lại mật khẩu' })
  async testPasswordReset(@Body() data: PasswordResetEmailDto) {
    const jobId = await this.queueService.enqueuePasswordResetEmail(data);
    return { jobId, message: 'Password reset email queued' };
  }

  @Post('test/verification-otp')
  @ApiOperation({ summary: 'Test: xếp hàng email OTP xác thực' })
  @ApiBody({ type: VerificationOtpEmailDto })
  async testVerificationOtp(@Body() data: VerificationOtpEmailDto) {
    const jobId = await this.queueService.enqueueVerificationOtpEmail(data);
    return { jobId, message: 'Verification OTP email queued' };
  }

  @Post('test/showtime-reminder')
  @ApiOperation({ summary: 'Test: xếp hàng email nhắc nhở lịch chiếu' })
  @ApiBody({ type: ShowtimeReminderEmailDto })
  async testShowtimeReminder(@Body() data: ShowtimeReminderEmailDto) {
    const jobId = await this.queueService.enqueueShowtimeReminderEmail(data);
    return { jobId, message: 'Showtime reminder email queued' };
  }

  @Post('test/promotion-notification')
  @ApiOperation({ summary: 'Test: xếp hàng email thông báo khuyến mãi' })
  @ApiBody({ type: PromotionNotificationEmailDto })
  async testPromotionNotification(@Body() data: PromotionNotificationEmailDto) {
    const jobId = await this.queueService.enqueuePromotionNotificationEmail(data);
    return { jobId, message: 'Promotion notification email queued' };
  }

  @Post('test/festival-notification')
  @ApiOperation({ summary: 'Test: xếp hàng email thông báo lễ hội' })
  @ApiBody({ type: FestivalNotificationEmailDto })
  async testFestivalNotification(@Body() data: FestivalNotificationEmailDto) {
    const jobId = await this.queueService.enqueueFestivalNotificationEmail(data);
    return { jobId, message: 'Festival notification email queued' };
  }
}


