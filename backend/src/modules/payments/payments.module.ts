import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../shared/schemas/payment.entity';
import { PaymentsService } from 'src/modules/payments/services/payments.service';
import { PaymentsController } from './controllers/payments.controller';
import { Booking } from '../../shared/schemas/booking.entity';
import { PaymentRepository } from './repositories/payment.repository';
import { BookingRepository } from './repositories/booking.repository';
import { VnpayService } from './services/vnpay.service';
import { QueueModule } from '../../providers/queue/queue.module';
import { PaymentTimeoutScheduler } from './schedulers/payment-timeout.scheduler';
import { SepayService } from './services/sepay.service';
import { MomoService } from './services/momo.service';
import { SeatBookingGateway } from '../seats/gateways/seat-booking.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Booking]),
    QueueModule,
  ],
  providers: [PaymentsService, PaymentRepository, BookingRepository, VnpayService, SepayService, MomoService, SeatBookingGateway, PaymentTimeoutScheduler],
  controllers: [PaymentsController],
  exports: [PaymentsService, VnpayService, SepayService, MomoService],
})
export class PaymentsModule {}
