import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailLog } from '../../shared/schemas/email-log.entity';
import { EmailLogsController } from './controllers/email-logs.controller';
import { EmailLogsService } from './services/email-logs.service';
import { EmailLogsRepository } from './repositories/email-logs.repository';

@Module({
  imports: [TypeOrmModule.forFeature([EmailLog])],
  controllers: [EmailLogsController],
  providers: [EmailLogsService, EmailLogsRepository],
  exports: [EmailLogsService, EmailLogsRepository],
})
export class EmailLogsModule {}


