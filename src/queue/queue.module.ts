import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './processors/email.processor';
import { QueueService } from './queue.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => MailModule),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
        db: parseInt(process.env.REDIS_DB || '0'),
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [EmailProcessor, QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
