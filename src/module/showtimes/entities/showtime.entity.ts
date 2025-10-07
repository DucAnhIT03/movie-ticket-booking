import { 
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn, } from 'typeorm';
import { Booking } from 'src/module/bookings/entities/booking.entity';
import { Movie } from 'src/module/movies/entities/movie.entity';


@Entity('showtimes')
export class Showtime {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  movieId: number; // ID phim (tham chiếu sang movies)

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column()
  room: string;

  @Column({ default: '2D' })
  format: string; // 2D / 3D

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Booking, (booking) => booking.showtime)
  bookings: Booking[];

  @ManyToOne(() => Movie, (movie) => movie.showtimes, { eager: false })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

}
