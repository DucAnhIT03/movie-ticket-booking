import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Booking } from 'src/module/bookings/entities/booking.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Booking, booking => booking.payments)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  payment_method: string;

  // keep property name payment_status if your code checks booking.payments[i].payment_status
  @Column({ name: 'payment_status', type: 'enum', enum: ['PENDING','COMPLETED','FAILED','CANCELLED'], default: 'PENDING' })
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

  @CreateDateColumn({ name: 'payment_time' })
  payment_time: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'transaction_id', type: 'varchar', length: 255, nullable: true })
  transaction_id?: string;
}
