import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private repo: Repository<Payment>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  async createPayment(bookingId: number, method: string, amount: number) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const p = this.repo.create({
      booking,
      payment_method: method,
      payment_status: 'PENDING',
      amount,
    });
    return this.repo.save(p);
  }

  // to be called by webhook from payment provider
  async completePayment(paymentId: number, transactionId: string, success = true) {
    const p = await this.repo.findOne({ where: { id: paymentId }, relations: ['booking'] });
    if (!p) throw new NotFoundException('Payment not found');
    p.transaction_id = transactionId;
    p.payment_status = success ? 'COMPLETED' : 'FAILED';
    await this.repo.save(p);

    if (success) {
      p.booking.status = 'BOOKED';
      await this.bookingRepo.save(p.booking);
    }
    return p;
  }
}
