import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Screen } from 'src/shared/schemas/screen.entity';
import { BookingSeat } from 'src/shared/schemas/booking-seat.entity'; 
import { SeatTypeEnum } from 'src/common/constrants/enums';

@Entity('Seats')
export class Seat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'screen_id' })
  screenId: number;

  @Column({ name: 'seat_number', length: 50 })
  seatNumber: string;

  @Column({ name: 'is_variable', type: 'bit', transformer: { from: (v: Buffer) => v[0] === 1, to: (v: boolean) => v } })
  isVariable: boolean;

  @Column({ name: 'is_hidden', type: 'bit', default: false, transformer: { from: (v: Buffer) => v ? v[0] === 1 : false, to: (v: boolean) => v } })
  isHidden: boolean;

  @Column({
    type: 'enum',
    enum: SeatTypeEnum,
  })
  type: SeatTypeEnum;

  @ManyToOne(() => Screen, (screen) => screen.seats)
  @JoinColumn({ name: 'screen_id' })
  screen: Screen;

  @OneToMany(() => BookingSeat, (bookingSeat) => bookingSeat.seat)
  bookingSeats: BookingSeat[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}