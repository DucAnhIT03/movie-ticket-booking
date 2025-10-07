import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { BookingSeat } from './entities/booking-seat.entity';
import { TicketPrice } from '../ticket-prices/entities/ticket-price.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingSeat, TicketPrice, Showtime])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
