import { Injectable } from '@nestjs/common';
import { QueueService } from './providers/queue/queue.service';

@Injectable()
export class AppService {
  constructor(private readonly queueService: QueueService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async demoEnqueueMail(): Promise<string | undefined> {
    return this.queueService.enqueueMail({
      to: 'demo@example.com',
      subject: 'Demo',
      text: 'This is a demo email job.',
    });
  }
}
