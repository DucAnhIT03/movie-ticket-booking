import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './services/bookings.service';
import { AdminBookingsController } from 'src/modules/bookings/controllers/admin-bookings.controller';
import { UserBookingsController } from 'src/modules/bookings/controllers/user-bookings.controller'
import { Booking } from '../../shared/schemas/booking.entity';
import { BookingSeat } from '../../shared/schemas/booking-seat.entity';
import { TicketPrice } from '../../shared/schemas/ticket-price.entity';
import { Showtime } from '../../shared/schemas/showtime.entity';
import { Seat } from '../../shared/schemas/seat.entity';
import { Payment } from 'src/shared/schemas/payment.entity';
import { EmailService } from '../notifications/services/email.service';
import { Screen }  from 'src/shared/schemas/screen.entity';
import { Users } from '../../shared/schemas/users.entity';
import { BookingRepository } from './repositories/booking.repository';
import { BookingSeatRepository } from './repositories/booking-seat.repository';
import { PaymentRepository } from './repositories/payment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingSeat, TicketPrice, Showtime, Seat, Payment, Screen, Users])],
  controllers: [AdminBookingsController,UserBookingsController],
  providers: [BookingsService, EmailService, BookingRepository, BookingSeatRepository, PaymentRepository],
  exports: [BookingsService],
})
export class BookingsModule {}
