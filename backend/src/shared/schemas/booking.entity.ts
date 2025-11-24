import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Users } from './users.entity';
import { Showtime } from 'src/shared/schemas/showtime.entity';
import { Payment } from 'src/shared/schemas/payment.entity';
import { BookingSeat } from './booking-seat.entity';

@Entity('Bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'showtime_id' })
  showtimeId: number;

  @Column({ name: 'total_seat' })
  totalSeat: number;

  @Column({ name: 'total_price_movie', type: 'double' })
  totalPriceMovie: number;

  @ManyToOne(() => Users, (user) => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Showtime, (showtime) => showtime.bookings)
  @JoinColumn({ name: 'showtime_id' })
  showtime: Showtime;

  @OneToMany(() => BookingSeat, (bookingSeat) => bookingSeat.booking)
  bookingSeats: BookingSeat[];

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at?: Date;
}