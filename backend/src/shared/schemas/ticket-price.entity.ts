import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SeatTypeEnum, MovieTypeEnum } from 'src/common/constrants/enums';
import { TheaterOrmEntity } from './theater.orm-entity';
import { Movie } from './movie.entity';

@Entity('Ticket_Prices')
export class TicketPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: SeatTypeEnum,
    name: 'type_seat', 
  })
  typeSeat: SeatTypeEnum; 

  @Column({
    type: 'enum',
    enum: MovieTypeEnum,
    name: 'type_movie',
  })
  typeMovie: MovieTypeEnum;

  @Column({ type: 'double' }) 
  price: number;

  @Column({
    name: 'day_type',
    type: 'bit',
    transformer: { 
      from: (v: Buffer | number | boolean) => {
        if (v === null || v === undefined) return null;
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v === 1;
        if (Buffer.isBuffer(v)) return v[0] === 1;
        return Boolean(v);
      }, 
      to: (v: boolean | number) => {
        if (v === null || v === undefined) return null;
        if (typeof v === 'number') return v;
        return v ? 1 : 0; // Convert boolean sang number (0/1) cho MySQL
      }
    }
  })
  dayType: boolean; 

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'theater_id', type: 'int', nullable: true })
  theaterId?: number | null;

  @ManyToOne(() => TheaterOrmEntity, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'theater_id' })
  theater?: TheaterOrmEntity | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date | null;

  @Column({ name: 'movie_id', type: 'int', nullable: true })
  movieId?: number | null;

  @ManyToOne(() => Movie, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: Movie | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at!: Date | null;
}