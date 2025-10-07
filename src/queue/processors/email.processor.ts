import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailService } from '../../mail/mail.service';

export interface EmailJobData {
  type: 'booking-confirmation' | 'booking-reminder' | 'password-reset' | 'welcome';
  to: string;
  data: any;
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('send-email')
  async handleEmail(job: Job<EmailJobData>) {
    this.logger.log(`Processing email job ${job.id} of type ${job.data.type}`);

    try {
      const { type, to, data } = job.data;
      let result = false;

      switch (type) {
        case 'booking-confirmation':
          result = await this.mailService.sendBookingConfirmation(to, data);
          break;
        case 'booking-reminder':
          result = await this.mailService.sendBookingReminder(to, data);
          break;
        case 'password-reset':
          result = await this.mailService.sendPasswordReset(to, data.resetLink);
          break;
        case 'welcome':
          result = await this.mailService.sendWelcomeEmail(to, data.userName);
          break;
        default:
          this.logger.error(`Unknown email type: ${type}`);
          throw new Error(`Unknown email type: ${type}`);
      }

      if (result) {
        this.logger.log(`Email sent successfully to ${to}`);
      } else {
        this.logger.error(`Failed to send email to ${to}`);
        throw new Error('Failed to send email');
      }
    } catch (error) {
      this.logger.error(`Error processing email job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('send-bulk-emails')
  async handleBulkEmails(job: Job<EmailJobData[]>) {
    this.logger.log(`Processing bulk email job ${job.id} with ${job.data.length} emails`);

    const results: Array<{ email: string; success: boolean; error?: string }> = [];
    for (const emailData of job.data) {
      try {
        const result = await this.handleEmail({ data: emailData } as Job<EmailJobData>);
        results.push({ email: emailData.to, success: true });
      } catch (error) {
        this.logger.error(`Failed to send email to ${emailData.to}:`, error);
        results.push({ email: emailData.to, success: false, error: (error as Error).message });
      }
    }

    this.logger.log(`Bulk email job completed. Success: ${results.filter(r => r.success).length}/${results.length}`);
    return results;
  }
}
