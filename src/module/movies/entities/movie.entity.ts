import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Showtime } from 'src/module/showtimes/entities/showtime.entity'; 

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  director: string;

  @Column()
  cast: string;

  @Column()
  genre: string;

  @Column({ type: 'date' })
  releaseDate: Date;

  @Column()
  duration: number; // phút

  @Column({ default: true })
  isShowing: boolean; // true = đang chiếu, false = sắp chiếu

  @Column({ nullable: true })
  posterUrl: string;

  @OneToMany(() => Showtime, (showtime) => showtime.movie)
  showtimes: Showtime[];
}
