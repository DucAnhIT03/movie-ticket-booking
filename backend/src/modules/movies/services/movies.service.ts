import { Injectable } from '@nestjs/common';
import { MoviesRepository } from '../repositories/movies.repository';
import type { MovieEntity } from '../../../shared/types/movie';

@Injectable()
export class MoviesService {
  constructor(private readonly moviesRepo: MoviesRepository) {}

  private formatMovieWithGenres(movie: any): any {
    return {
      ...movie,
      genres: (movie.movieGenres || [])
        .map((mg: any) => mg.genre?.genreName)
        .filter(Boolean),
    };
  }

  async findNowShowing(): Promise<any[]> {
    const now = new Date();
    const movies = await this.moviesRepo.findNowShowing(now);
    return movies.map(m => this.formatMovieWithGenres(m));
  }

  async findComingSoon(): Promise<any[]> {
    const now = new Date();
    const movies = await this.moviesRepo.findComingSoon(now);
    return movies.map(m => this.formatMovieWithGenres(m));
  }

  async findAll(): Promise<MovieEntity[]> {
    return this.moviesRepo.findAll();
  }

  async findOne(id: number): Promise<MovieEntity | null> {
    return this.moviesRepo.findById(id);
  }
}

