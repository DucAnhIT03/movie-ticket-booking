import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';


@Entity('booking_seat')
export class BookingSeat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bookingId: number;

  @Column()
  seatId: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => Booking, (booking) => booking.seats)

  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

}
