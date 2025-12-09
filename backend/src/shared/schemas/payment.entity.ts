import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Booking } from 'src/shared/schemas/booking.entity';
import { Promotion } from 'src/shared/schemas/promotion.entity';
import { PaymentMethod, PaymentStatus } from 'src/common/constrants/enums';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Booking, booking => booking.payments)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod
  })
  payment_method: PaymentMethod;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  payment_status: PaymentStatus;

  @Column({ name: 'payment_time', type: 'datetime', nullable: true })
  payment_time?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: false })
  amount: number;

  @Column({ name: 'transaction_id', type: 'varchar', length: 255, nullable: true })
  transaction_id?: string;

  @Column({ name: 'promotion_id', type: 'int', nullable: true })
  promotionId?: number | null;

  @ManyToOne(() => Promotion, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'promotion_id' })
  promotion?: Promotion | null;
}
