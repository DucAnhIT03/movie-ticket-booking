import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MovieGenre } from './movie-genre.entity';

@Entity({ name: 'genres' })
export class Genre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'genre_name', length: 255 })
  genreName: string;

  @OneToMany(() => MovieGenre, (mg) => mg.genre)
  movieGenres: MovieGenre[];
}
