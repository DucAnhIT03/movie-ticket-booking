import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: any;
  html?: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: 587, // Thử port 587 (TLS)
      secure: false, // Tắt SSL, dùng TLS
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS')?.replace(/\s/g, ''), // Loại bỏ khoảng trắng
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendMail(options: EmailOptions): Promise<boolean> {
    try {
      let html = options.html;

      if (options.template && !html) {
        html = await this.compileTemplate(options.template, options.context);
      }

      const mailOptions = {
        from: this.configService.get('MAIL_FROM'),
        to: options.to,
        subject: options.subject,
        html,
        text: options.text || '',
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  private async compileTemplate(templateName: string, context: any): Promise<string> {
    try {
      const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      return template(context);
    } catch (error) {
      this.logger.error(`Failed to compile template ${templateName}:`, error);
      throw error;
    }
  }

  // Email templates for booking system
  async sendBookingConfirmation(email: string, bookingData: any): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: 'Xác nhận đặt vé thành công',
      template: 'booking-confirmation',
      context: bookingData,
    });
  }

  async sendBookingReminder(email: string, bookingData: any): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: 'Nhắc nhở lịch chiếu phim',
      template: 'booking-reminder',
      context: bookingData,
    });
  }

  async sendPasswordReset(email: string, resetLink: string): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: 'Đặt lại mật khẩu',
      template: 'password-reset',
      context: { resetLink },
    });
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: 'Chào mừng đến với hệ thống đặt vé',
      template: 'welcome',
      context: { userName },
    });
  }
}
