import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingSeat } from '../bookings/entities/booking-seat.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingSeat, Payment])],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
