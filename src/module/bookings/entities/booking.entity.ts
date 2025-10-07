import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Showtime } from 'src/module/showtimes/entities/showtime.entity';
import { BookingSeat } from './booking-seat.entity';
import { Payment } from 'src/module/payments/entities/payment.entity';
import { User } from 'src/module/users/entities/user.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.bookings, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Showtime, (showtime) => showtime.bookings, { eager: true })
  @JoinColumn({ name: 'showtime_id' })
  showtime: Showtime;

  @OneToMany(() => BookingSeat, (seat) => seat.booking, { cascade: true, eager: true })
  seats: BookingSeat[];

  @OneToMany(() => Payment, payment => payment.booking)
  payments: Payment[];

  @Column({ type: 'int', default: 1 })
  total_seat: number;

  @Column({ type: 'double', default: 0 })
  total_price_movie: number;

  @Column({ type: 'enum', enum: ['PENDING', 'BOOKED', 'CANCELLED'], default: 'PENDING' })
  status: 'PENDING' | 'BOOKED' | 'CANCELLED';

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
