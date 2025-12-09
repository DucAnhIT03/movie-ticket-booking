import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import { EmailType, EmailPriority } from '../mail/constants/email.constants';
import type { SendMailPayload } from '../mail/mail.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue('mailQueue') private readonly mailQueue: Queue) {}

  
  async enqueueMail(payload: SendMailPayload, options?: JobsOptions): Promise<string | undefined> {
    try {
      
      if (!payload.to) {
        throw new Error('Email recipient (to) is required');
      }

      if (!payload.subject) {
        throw new Error('Email subject is required');
      }

   
      if (!payload.type || !payload.data) {
        if (!payload.html && !payload.text) {
          throw new Error('Email content (html or text) is required');
        }
      }

      const defaultOptions: JobsOptions = {
        attempts: 3,
        backoff: { 
          type: 'exponential', 
          delay: 2000,
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 3600, // 24 hours
        },
        removeOnFail: {
          count: 5000,
          age: 7 * 24 * 3600, // 7 days
        },
        priority: payload.type ? this.getEmailPriority(payload.type) : EmailPriority.MEDIUM,
      };

      const jobOptions = { ...defaultOptions, ...options };

      const jobAdded = await this.mailQueue.add('sendMail', payload, jobOptions);
      this.logger.log(`Email job ${jobAdded.id} queued for ${payload.to} [${payload.type || 'CUSTOM'}]`);
      
      return jobAdded.id?.toString();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to enqueue email job for ${payload.to}: ${errorMessage}`, error);
      throw error;
    }
  }

 
  async enqueueBookingConfirmationEmail(data: any): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject,
      type: EmailType.BOOKING_CONFIRMATION,
      data,
    });
  }

  
  async enqueueBookingInvoiceEmail(data: any): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject,
      type: EmailType.BOOKING_INVOICE,
      data,
    });
  }

 
  async enqueueRegistrationEmail(data: any): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject,
      type: EmailType.REGISTRATION_CONFIRMATION,
      data,
    });
  }


  async enqueueWelcomeEmail(data: any): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject,
      type: EmailType.WELCOME,
      data,
    });
  }


  async enqueuePasswordResetEmail(data: any): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject,
      type: EmailType.PASSWORD_RESET,
      data,
    }, {
      attempts: 2, 
      priority: EmailPriority.HIGH,
    });
  }


  async enqueuePasswordChangedEmail(data: any): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject,
      type: EmailType.PASSWORD_CHANGED,
      data,
    });
  }

  
  async enqueueBookingCancelledEmail(data: any): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject,
      type: EmailType.BOOKING_CANCELLED,
      data,
    });
  }

  async enqueueVerificationOtpEmail(data: any): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject || 'Mã xác thực tài khoản',
      type: EmailType.VERIFICATION_OTP,
      data,
    }, {
      attempts: 2,
      priority: EmailPriority.HIGH,
    });
  }

  async enqueueShowtimeReminderEmail(data: any, delayMs?: number): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject || 'Nhắc nhở lịch chiếu',
      type: EmailType.SHOWTIME_REMINDER,
      data,
    }, {
      delay: delayMs,
      priority: EmailPriority.MEDIUM,
    });
  }

  async enqueuePromotionNotificationEmail(data: any): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject || 'Khuyến mãi đặc biệt',
      type: EmailType.PROMOTION_NOTIFICATION,
      data,
    }, {
      priority: EmailPriority.LOW,
    });
  }

  async enqueueFestivalNotificationEmail(data: any): Promise<string | undefined> {
    return this.enqueueMail({
      to: data.to,
      subject: data.subject || 'Thông báo lễ hội phim',
      type: EmailType.FESTIVAL_NOTIFICATION,
      data,
    }, {
      priority: EmailPriority.LOW,
    });
  }

  
  async getQueueStats() {
    const waiting = await this.mailQueue.getWaitingCount();
    const active = await this.mailQueue.getActiveCount();
    const completed = await this.mailQueue.getCompletedCount();
    const failed = await this.mailQueue.getFailedCount();

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active,
    };
  }

  
  async retryFailedJobs(limit: number = 10) {
    try {
      const failedJobs = await this.mailQueue.getFailed(0, limit - 1);
      const retriedCount = failedJobs.length;
      
      for (const job of failedJobs) {
        try {
          await job.retry();
          this.logger.log(`Retried failed job ${job.id} for ${job.data?.to}`);
        } catch (error) {
          this.logger.error(`Failed to retry job ${job.id}:`, error);
        }
      }
      
      this.logger.log(`Retried ${retriedCount} failed email jobs`);
      return { retried: retriedCount };
    } catch (error) {
      this.logger.error('Error retrying failed jobs:', error);
      throw error;
    }
  }

 
  async cleanJobs(grace: number = 24 * 3600 * 1000, limit: number = 1000) {
    try {
      const completedCleaned = await this.mailQueue.clean(grace, limit, 'completed');
      const failedCleaned = await this.mailQueue.clean(grace, limit, 'failed');
      
      this.logger.log(`Cleaned ${completedCleaned.length} completed jobs and ${failedCleaned.length} failed jobs`);
      return { 
        completed: completedCleaned.length, 
        failed: failedCleaned.length 
      };
    } catch (error) {
      this.logger.error('Error cleaning jobs:', error);
      throw error;
    }
  }

  private getEmailPriority(type: EmailType): EmailPriority {
    const priorityMap: Record<EmailType, EmailPriority> = {
      [EmailType.PASSWORD_RESET]: EmailPriority.HIGH,
      [EmailType.BOOKING_CONFIRMATION]: EmailPriority.HIGH,
      [EmailType.BOOKING_INVOICE]: EmailPriority.HIGH,
      [EmailType.PAYMENT_RECEIPT]: EmailPriority.HIGH,
      [EmailType.VERIFICATION_OTP]: EmailPriority.HIGH,
      [EmailType.SHOWTIME_REMINDER]: EmailPriority.MEDIUM,
      [EmailType.BOOKING_CANCELLED]: EmailPriority.MEDIUM,
      [EmailType.BOOKING_UPDATED]: EmailPriority.MEDIUM,
      [EmailType.REGISTRATION_CONFIRMATION]: EmailPriority.MEDIUM,
      [EmailType.WELCOME]: EmailPriority.LOW,
      [EmailType.PASSWORD_CHANGED]: EmailPriority.LOW,
      [EmailType.ADMIN_NOTIFICATION]: EmailPriority.LOW,
      [EmailType.PROMOTION_NOTIFICATION]: EmailPriority.LOW,
      [EmailType.FESTIVAL_NOTIFICATION]: EmailPriority.LOW,
      [EmailType.PAYMENT_FAILED]: EmailPriority.HIGH,
    };

    return priorityMap[type] || EmailPriority.MEDIUM;
  }
}



