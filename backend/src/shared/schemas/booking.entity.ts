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
import { BookingChannel } from '../../common/constants/enums';

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

  @Column({
    name: 'channel',
    type: 'enum',
    enum: BookingChannel,
    default: BookingChannel.ONLINE,
  })
  channel: BookingChannel;

  @Column({ name: 'customer_name', length: 255, nullable: true })
  customerName?: string;

  @Column({ name: 'customer_phone', length: 20, nullable: true })
  customerPhone?: string;

  @Column({ name: 'created_by_staff_id', nullable: true })
  createdByStaffId?: number | null;

  @Column({ name: 'invoice_code', type: 'varchar', length: 50, nullable: true, unique: true })
  invoiceCode?: string | null;

  @ManyToOne(() => Users, (user) => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'created_by_staff_id' })
  createdByStaff?: Users | null;

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