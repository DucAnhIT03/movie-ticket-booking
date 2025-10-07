import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EmailJobData } from './processors/email.processor';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async addEmailJob(data: EmailJobData, delay?: number): Promise<void> {
    try {
      const jobOptions: any = {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      };

      if (delay) {
        jobOptions.delay = delay;
      }

      await this.emailQueue.add('send-email', data, jobOptions);
      this.logger.log(`Email job added to queue for ${data.to}`);
    } catch (error) {
      this.logger.error(`Failed to add email job:`, error);
      throw error;
    }
  }

  async addBulkEmailJob(emails: EmailJobData[]): Promise<void> {
    try {
      await this.emailQueue.add('send-bulk-emails', emails, {
        removeOnComplete: 5,
        removeOnFail: 3,
        attempts: 2,
      });
      this.logger.log(`Bulk email job added to queue with ${emails.length} emails`);
    } catch (error) {
      this.logger.error(`Failed to add bulk email job:`, error);
      throw error;
    }
  }

  async addDelayedEmailJob(data: EmailJobData, delayMs: number): Promise<void> {
    await this.addEmailJob(data, delayMs);
  }

  // Convenience methods for common email types
  async sendBookingConfirmation(email: string, bookingData: any): Promise<void> {
    await this.addEmailJob({
      type: 'booking-confirmation',
      to: email,
      data: bookingData,
    });
  }

  async sendBookingReminder(email: string, bookingData: any, delayMs?: number): Promise<void> {
    await this.addEmailJob({
      type: 'booking-reminder',
      to: email,
      data: bookingData,
    }, delayMs);
  }

  async sendPasswordReset(email: string, resetLink: string): Promise<void> {
    await this.addEmailJob({
      type: 'password-reset',
      to: email,
      data: { resetLink },
    });
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    await this.addEmailJob({
      type: 'welcome',
      to: email,
      data: { userName },
    });
  }

  // Queue management methods
  async getQueueStats() {
    const waiting = await this.emailQueue.getWaiting();
    const active = await this.emailQueue.getActive();
    const completed = await this.emailQueue.getCompleted();
    const failed = await this.emailQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async clearQueue() {
    await this.emailQueue.empty();
    this.logger.log('Email queue cleared');
  }

  async pauseQueue() {
    await this.emailQueue.pause();
    this.logger.log('Email queue paused');
  }

  async resumeQueue() {
    await this.emailQueue.resume();
    this.logger.log('Email queue resumed');
  }
}
