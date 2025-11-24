import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { EmailType } from '../../mail/constants/email.constants';

@Processor('mailQueue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const startTime = Date.now();
    const jobId = job.id;
    const jobName = job.name;
    const emailTo = job.data?.to || 'unknown';
    
    try {
      this.logger.log(`[Job ${jobId}] Processing email job [${jobName}] for ${emailTo}`);
      
      // Validate job data
      if (!job.data) {
        throw new Error('Job data is missing');
      }

      if (job.name === 'sendMail') {
        await this.mailService.send(job.data);
      } else {
        throw new Error(`Unknown job type: ${job.name}`);
      }

      const duration = Date.now() - startTime;
      this.logger.log(`[Job ${jobId}] Email job completed successfully in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const emailType = job.data?.type || 'UNKNOWN';
      const attemptsMade = job.attemptsMade || 0;
      
      this.logger.error(
        `[Job ${jobId}] Email job failed after ${duration}ms (attempt ${attemptsMade + 1}): ${errorMessage}`,
        errorStack
      );
      
      this.logger.warn(`[Job ${jobId}] Failed email type: ${emailType}, recipient: ${emailTo}, attempts: ${attemptsMade}`);
      
      // Re-throw để BullMQ có thể retry
      throw error;
    }
  }


  async onCompleted(job: Job): Promise<void> {
    this.logger.log(`Email job ${job.id} successfully sent to ${job.data?.to}`);
  }


  async onFailed(job: Job, error: Error): Promise<void> {
    this.logger.error(
      `Email job ${job.id} failed permanently after ${job.attemptsMade} attempts. Error: ${error.message}`,
      error.stack
    );
  }


  async onStalled(job: Job): Promise<void> {
    this.logger.warn(`Email job ${job.id} stalled for ${job.data?.to}`);
  }

  
  async onActive(job: Job): Promise<void> {
    this.logger.debug(`Email job ${job.id} is now active`);
  }
}



