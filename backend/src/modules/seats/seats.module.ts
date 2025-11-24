import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from '../../shared/schemas/seat.entity';
import { Screen } from '../../shared/schemas/screen.entity';
import { Showtime } from '../../shared/schemas/showtime.entity';
import { Booking } from '../../shared/schemas/booking.entity';
import { BookingSeat } from '../../shared/schemas/booking-seat.entity';
import { SeatsService } from './services/seats.service';
import { SeatsController } from './controllers/seats.controller';
import { SeatRepository } from './repositories/seat.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Seat, Screen, Showtime, Booking, BookingSeat])],
  controllers: [SeatsController],
  providers: [SeatsService, SeatRepository],
  exports: [SeatsService],
})
export class SeatsModule {}
