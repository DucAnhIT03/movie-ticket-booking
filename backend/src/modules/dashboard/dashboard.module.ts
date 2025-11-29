import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { Users } from '../../shared/schemas/users.entity';
import { TheaterOrmEntity } from '../../shared/schemas/theater.orm-entity';
import { Screen } from '../../shared/schemas/screen.entity';
import { Showtime } from '../../shared/schemas/showtime.entity';
import { Booking } from '../../shared/schemas/booking.entity';
import { Payment } from '../../shared/schemas/payment.entity';
import { EmailLog } from '../../shared/schemas/email-log.entity';
import { QueueModule } from '../../providers/queue/queue.module';
import { Movie } from '../../shared/schemas/movie.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      TheaterOrmEntity,
      Screen,
      Showtime,
      Movie,
      Booking,
      Payment,
      EmailLog,
    ]),
    forwardRef(() => QueueModule),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}



