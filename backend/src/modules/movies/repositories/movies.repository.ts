import type { MovieEntity } from '../../../shared/types/movie';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../../../shared/schemas/movie.entity';

@Injectable()
export class MoviesRepository {
  constructor(
    @InjectRepository(Movie) private readonly repo: Repository<Movie>,
  ) {}

  async findAll(): Promise<MovieEntity[]> {
    const rows = await this.repo.find({ order: { releaseDate: 'DESC' } });
    return rows as unknown as MovieEntity[];
  }

  async findById(id: number): Promise<MovieEntity | null> {
    const row = await this.repo.findOne({ where: { id } });
    return (row as unknown as MovieEntity) ?? null;
  }

  async findNowShowing(now: Date): Promise<MovieEntity[]> {

    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);
    startOfTomorrow.setMinutes(0, 0);
    startOfTomorrow.setSeconds(0, 0);
    startOfTomorrow.setMilliseconds(0);
    
    const movies = await this.repo
      .createQueryBuilder('movie')
      .where('COALESCE(movie.start_date, movie.release_date) < :startOfTomorrow', { startOfTomorrow })
      .orderBy('COALESCE(movie.start_date, movie.release_date)', 'DESC')
      .getMany();

    
    const movieIds = movies.map(m => m.id);
    if (movieIds.length === 0) {
      return movies as unknown as MovieEntity[];
    }

    const genresData = await this.repo.manager
      .createQueryBuilder()
      .select('mg.movie_id', 'movieId')
      .addSelect('g.id', 'genreId')
      .addSelect('g.genre_name', 'genreName')
      .from('Movie_Genre', 'mg')
      .leftJoin('Genre', 'g', 'g.id = mg.genre_id')
      .where('mg.movie_id IN (:...movieIds)', { movieIds })
      .getRawMany();

    
    const genresByMovieId = new Map<number, any[]>();
    genresData.forEach((row: any) => {
      if (!genresByMovieId.has(row.movieId)) {
        genresByMovieId.set(row.movieId, []);
      }
      if (row.genreId) {
        genresByMovieId.get(row.movieId)!.push({
          genre: {
            id: row.genreId,
            genreName: row.genreName
          }
        });
      }
    });

  
    return (movies as any[]).map(movie => ({
      ...movie,
      movieGenres: genresByMovieId.get(movie.id) || []
    })) as unknown as MovieEntity[];
  }

  async findComingSoon(now: Date): Promise<MovieEntity[]> {
    
    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);
    startOfTomorrow.setMinutes(0, 0);
    startOfTomorrow.setSeconds(0, 0);
    startOfTomorrow.setMilliseconds(0);
    
    
    const movies = await this.repo
      .createQueryBuilder('movie')
      .where('COALESCE(movie.start_date, movie.release_date) >= :startOfTomorrow', { startOfTomorrow })
      .orderBy('COALESCE(movie.start_date, movie.release_date)', 'ASC')
      .getMany();

    
    const movieIds = movies.map(m => m.id);
    if (movieIds.length === 0) {
      return movies as unknown as MovieEntity[];
    }

    const genresData = await this.repo.manager
      .createQueryBuilder()
      .select('mg.movie_id', 'movieId')
      .addSelect('g.id', 'genreId')
      .addSelect('g.genre_name', 'genreName')
      .from('Movie_Genre', 'mg')
      .leftJoin('Genre', 'g', 'g.id = mg.genre_id')
      .where('mg.movie_id IN (:...movieIds)', { movieIds })
      .getRawMany();

    
    const genresByMovieId = new Map<number, any[]>();
    genresData.forEach((row: any) => {
      if (!genresByMovieId.has(row.movieId)) {
        genresByMovieId.set(row.movieId, []);
      }
      if (row.genreId) {
        genresByMovieId.get(row.movieId)!.push({
          genre: {
            id: row.genreId,
            genreName: row.genreName
          }
        });
      }
    });

    return (movies as any[]).map(movie => ({
      ...movie,
      movieGenres: genresByMovieId.get(movie.id) || []
    })) as unknown as MovieEntity[];
  }
}

