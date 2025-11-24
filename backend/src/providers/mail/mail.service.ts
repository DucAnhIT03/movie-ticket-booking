import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplates } from './templates/email-templates';
import { EmailType, EMAIL_TEMPLATES } from './constants/email.constants';
import { EmailLog } from 'src/shared/schemas/email-log.entity';
import {
  BookingConfirmationEmailDto,
  BookingInvoiceEmailDto,
  RegistrationEmailDto,
  PasswordResetEmailDto,
  PasswordChangedEmailDto,
  WelcomeEmailDto,
  BookingCancelledEmailDto,
  VerificationOtpEmailDto,
  ShowtimeReminderEmailDto,
  PromotionNotificationEmailDto,
  FestivalNotificationEmailDto,
  BaseEmailDto,
} from './dto/email.dto';

export type SendMailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  type?: EmailType;
  data?: any;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(EmailLog)
    private readonly emailLogRepo: Repository<EmailLog>,
  ) {
    const host = this.config.get<string>('MAIL_HOST', 'localhost');
    const port = Number(this.config.get<string>('MAIL_PORT', '1025'));
    const secureEnv = this.config.get<string>('MAIL_SECURE');
    const secure = secureEnv ? secureEnv === 'true' || secureEnv === '1' : false;
    const user = this.config.get<string>('MAIL_USER', '');
    const pass = this.config.get<string>('MAIL_PASS', '');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Mail server configuration error:', error);
      } else {
        this.logger.log('Mail server connected successfully');
      }
    });
  }

  async send(payload: SendMailPayload): Promise<void> {
    // Validate email address
    if (!payload.to || !this.isValidEmail(payload.to)) {
      throw new Error(`Invalid email address: ${payload.to}`);
    }

    if (!payload.subject || payload.subject.trim().length === 0) {
      throw new Error('Email subject is required');
    }

    let emailLog: EmailLog | null = null;
    
    try {
      const from = this.config.get<string>('MAIL_FROM', 'no-reply@example.com');
      
      let html = payload.html;
      let subject = payload.subject.trim();

      if (payload.type && payload.data) {
        html = this.generateEmailContent(payload.type, payload.data);
        const templateConfig = EMAIL_TEMPLATES[payload.type];
        subject = templateConfig ? templateConfig.subject : subject;
      }

      // Validate HTML content
      if (!html && !payload.text) {
        throw new Error('Email content (html or text) is required');
      }

      // Tạo log entry trước khi gửi
      emailLog = this.emailLogRepo.create({
        to: payload.to,
        subject,
        type: payload.type,
        status: 'PENDING',
        metadata: payload.data,
      });
      emailLog = await this.emailLogRepo.save(emailLog);

      // Gửi email với timeout
      const result = await Promise.race([
        this.transporter.sendMail({
          from,
          to: payload.to,
          subject,
          html,
          text: payload.text,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
        ),
      ]) as any;

      // Cập nhật log thành công
      if (emailLog) {
        emailLog.status = 'SENT';
        emailLog.messageId = result.messageId;
        await this.emailLogRepo.save(emailLog);
      }

      this.logger.log(`Email sent successfully to ${payload.to} [${payload.type || 'CUSTOM'}] - MessageId: ${result.messageId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      // Cập nhật log thất bại
      if (emailLog) {
        emailLog.status = 'FAILED';
        emailLog.error = errorMessage.length > 1000 ? errorMessage.substring(0, 1000) : errorMessage;
        try {
          await this.emailLogRepo.save(emailLog);
        } catch (saveError) {
          this.logger.error('Failed to save email log:', saveError);
        }
      }
      
      this.logger.error(`Failed to send email to ${payload.to}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateEmailContent(type: EmailType, data: any): string {
    switch (type) {
      case EmailType.WELCOME:
        return EmailTemplates.getWelcomeEmail(data as WelcomeEmailDto);
      
      case EmailType.REGISTRATION_CONFIRMATION:
        return EmailTemplates.getRegistrationConfirmationEmail(data as RegistrationEmailDto);
      
      case EmailType.BOOKING_CONFIRMATION:
        return EmailTemplates.getBookingConfirmationEmail(data as BookingConfirmationEmailDto);
      
      case EmailType.BOOKING_INVOICE:
        return EmailTemplates.getBookingInvoiceEmail(data as BookingInvoiceEmailDto);
      
      case EmailType.PASSWORD_RESET:
        return EmailTemplates.getPasswordResetEmail(data as PasswordResetEmailDto);
      
      case EmailType.PASSWORD_CHANGED:
        return EmailTemplates.getPasswordChangedEmail(data as PasswordChangedEmailDto);
      
      case EmailType.BOOKING_CANCELLED:
        return EmailTemplates.getBookingCancelledEmail(data as BookingCancelledEmailDto);
      
      case EmailType.VERIFICATION_OTP:
        return EmailTemplates.getVerificationOtpEmail(data as VerificationOtpEmailDto);
      
      case EmailType.SHOWTIME_REMINDER:
        return EmailTemplates.getShowtimeReminderEmail(data as ShowtimeReminderEmailDto);
      
      case EmailType.PROMOTION_NOTIFICATION:
        return EmailTemplates.getPromotionNotificationEmail(data as PromotionNotificationEmailDto);
      
      case EmailType.FESTIVAL_NOTIFICATION:
        return EmailTemplates.getFestivalNotificationEmail(data as FestivalNotificationEmailDto);
      
      default:
        this.logger.warn(`Unknown email type: ${type}`);
        return '';
    }
  }

  // Convenience methods for specific email types
  async sendWelcomeEmail(data: WelcomeEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.WELCOME].subject,
      type: EmailType.WELCOME,
      data,
    });
  }

  async sendRegistrationConfirmationEmail(data: RegistrationEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.REGISTRATION_CONFIRMATION].subject,
      type: EmailType.REGISTRATION_CONFIRMATION,
      data,
    });
  }

  async sendBookingConfirmationEmail(data: BookingConfirmationEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.BOOKING_CONFIRMATION].subject,
      type: EmailType.BOOKING_CONFIRMATION,
      data,
    });
  }

  async sendBookingInvoiceEmail(data: BookingInvoiceEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.BOOKING_INVOICE].subject,
      type: EmailType.BOOKING_INVOICE,
      data,
    });
  }

  async sendPasswordResetEmail(data: PasswordResetEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.PASSWORD_RESET].subject,
      type: EmailType.PASSWORD_RESET,
      data,
    });
  }

  async sendPasswordChangedEmail(data: PasswordChangedEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.PASSWORD_CHANGED].subject,
      type: EmailType.PASSWORD_CHANGED,
      data,
    });
  }

  async sendBookingCancelledEmail(data: BookingCancelledEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.BOOKING_CANCELLED].subject,
      type: EmailType.BOOKING_CANCELLED,
      data,
    });
  }

  async sendVerificationOtpEmail(data: VerificationOtpEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.VERIFICATION_OTP].subject,
      type: EmailType.VERIFICATION_OTP,
      data,
    });
  }

  async sendShowtimeReminderEmail(data: ShowtimeReminderEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.SHOWTIME_REMINDER].subject,
      type: EmailType.SHOWTIME_REMINDER,
      data,
    });
  }

  async sendPromotionNotificationEmail(data: PromotionNotificationEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.PROMOTION_NOTIFICATION].subject,
      type: EmailType.PROMOTION_NOTIFICATION,
      data,
    });
  }

  async sendFestivalNotificationEmail(data: FestivalNotificationEmailDto): Promise<void> {
    await this.send({
      to: data.to,
      subject: EMAIL_TEMPLATES[EmailType.FESTIVAL_NOTIFICATION].subject,
      type: EmailType.FESTIVAL_NOTIFICATION,
      data,
    });
  }

 
  async sendBatchEmails(payloads: SendMailPayload[]): Promise<void> {
    const results = await Promise.allSettled(
      payloads.map(payload => this.send(payload))
    );
    
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      this.logger.warn(`Failed to send ${failures.length} out of ${payloads.length} emails`);
    }
  }
}


