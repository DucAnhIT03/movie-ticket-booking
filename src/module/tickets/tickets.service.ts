import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from 'src/module/bookings/entities/booking.entity';
import { Payment } from 'src/module/payments/entities/payment.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async getUserTickets(userId: number) {
    return this.bookingRepo.find({
      where: { user: { id: userId } } as any, // cast as any if TS still complains
      relations: ['showtime', 'seats', 'payments'],
      order: { created_at: 'DESC' },
    });
  }

  async cancelTicket(bookingId: number, userId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId } as any,
      relations: ['payments','user','showtime'],
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.user?.id !== userId) throw new BadRequestException('Not your booking');

    // check any completed payment
    const hasCompleted = (booking.payments || []).some(p => (p.payment_status === 'COMPLETED'));
    if (hasCompleted) {
      throw new BadRequestException('Cannot cancel a booking with completed payment');
    }

    // check showtime not started
    if (booking.showtime && new Date(booking.showtime.startTime) <= new Date()) {
      throw new BadRequestException('Cannot cancel after showtime started');
    }

    booking.status = 'CANCELLED';
    await this.bookingRepo.save(booking);
    return { message: 'Booking cancelled' };
  }
}
