import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { QueueModule } from '../queue/queue.module';
import { mailConfig } from '../config/mail.config';

@Module({
  imports: [ConfigModule.forFeature(mailConfig), forwardRef(() => QueueModule)],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
