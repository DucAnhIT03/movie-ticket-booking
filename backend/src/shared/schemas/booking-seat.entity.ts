import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Booking } from './booking.entity';
import { Seat } from 'src/shared/schemas/seat.entity'; 

@Entity('Booking_Seat')
export class BookingSeat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'booking_id' })
  bookingId: number;

  @Column({ name: 'seat_id' })
  seatId: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Booking, (booking) => booking.bookingSeats)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Seat, (seat) => seat.bookingSeats)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}