import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum SeatType {
  STANDARD = 'STANDARD',
  VIP = 'VIP',
  SWEETBOX = 'SWEETBOX',
}

@Entity('ticket_prices')
export class TicketPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: SeatType })
  type_seat: SeatType;

  @Column({ type: 'enum', enum: ['2D', '3D'] })
  type_movie: '2D' | '3D';

  @Column({ type: 'tinyint', width: 1, default: 0 })
  day_type: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'time', nullable: true })
  start_time?: string;

  @Column({ type: 'time', nullable: true })
  end_time?: string;
}
