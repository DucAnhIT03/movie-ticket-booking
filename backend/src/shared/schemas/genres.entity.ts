import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { MovieGenre } from '../schemas/movie-genre.entity';

@Entity({ name: 'Genre' })
export class Genre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'genre_name', length: 255 })
  genreName: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at!: Date | null;

  @OneToMany(() => MovieGenre, (mg) => mg.genre)
  movieGenres: MovieGenre[];
}
