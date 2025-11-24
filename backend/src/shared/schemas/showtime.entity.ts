import { 
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne, 
  JoinColumn  
} from 'typeorm';

import { Booking } from './booking.entity'; 

import { Screen } from 'src/shared/schemas/screen.entity'; 
import { Movie } from './movie.entity';

@Entity({ name: 'ShowTimes' })
export class Showtime {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'screen_id' })
  screenId: number;

  @Column({ name: 'movie_id' })
  movieId: number;

  @Column({ name: 'start_time', type: 'datetime' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime' })
  endTime: Date;

  @ManyToOne(() => Screen, (screen) => screen.showtimes) 
  @JoinColumn({ name: 'screen_id' })
  screen: Screen;

  @ManyToOne(() => Movie)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @OneToMany(() => Booking, (booking) => booking.showtime)
  bookings: Booking[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}