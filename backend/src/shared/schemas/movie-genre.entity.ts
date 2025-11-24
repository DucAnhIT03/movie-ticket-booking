import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Movie } from './movie.entity';
import { Genre } from './genres.entity';

@Entity({ name: 'Movie_Genre' })
export class MovieGenre {
  @PrimaryColumn({ name: 'movie_id' })
  movieId: number;

  @PrimaryColumn({ name: 'genre_id' })
  genreId: number;

  @ManyToOne(() => Movie, (movie) => movie.movieGenres)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @ManyToOne(() => Genre, (genre) => genre.movieGenres)
  @JoinColumn({ name: 'genre_id' })
  genre: Genre;
}
