import { Entity, PrimaryGeneratedColumn, OneToMany, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Seat } from 'src/shared/schemas/seat.entity';
import { Showtime } from 'src/shared/schemas/showtime.entity';
import { TheaterOrmEntity } from './theater.orm-entity';

@Entity('Screens')
export class Screen {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'seat_capacity', type: 'int' })
  seatCapacity: number;

  @Column({ name: 'theater_id', type: 'int' })
  theaterId: number;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updatedAt?: Date;

  @ManyToOne(() => TheaterOrmEntity, { eager: false })
  @JoinColumn({ name: 'theater_id' })
  theater?: TheaterOrmEntity;

  @OneToMany(() => Seat, (seat) => seat.screen)
  seats: Seat[];

  @OneToMany(() => Showtime, (showtime) => showtime.screen)
  showtimes: Showtime[];
  
}