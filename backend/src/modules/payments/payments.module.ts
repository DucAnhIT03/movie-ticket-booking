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

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Booking]),
    QueueModule,
  ],
  providers: [PaymentsService, PaymentRepository, BookingRepository, VnpayService, PaymentTimeoutScheduler],
  controllers: [PaymentsController],
  exports: [PaymentsService, VnpayService],
})
export class PaymentsModule {}
