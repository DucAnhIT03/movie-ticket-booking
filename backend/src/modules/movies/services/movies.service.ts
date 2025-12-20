import { Injectable } from '@nestjs/common';
import { MoviesRepository } from '../repositories/movies.repository';
import type { MovieEntity } from '../../../shared/types/movie';
import { RedisCacheService } from '../../../providers/redis-cache';

@Injectable()
export class MoviesService {
  constructor(
    private readonly moviesRepo: MoviesRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  private formatMovieWithGenres(movie: any): any {
    return {
      ...movie,
      genres: (movie.movieGenres || [])
        .map((mg: any) => mg.genre?.genreName)
        .filter(Boolean),
    };
  }

  async findNowShowing(): Promise<any[]> {
    const cacheKey = this.cacheService.generateKey(RedisCacheService.KEYS.MOVIES, 'now-showing');
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const movies = await this.moviesRepo.findNowShowing(now);
        return movies.map(m => this.formatMovieWithGenres(m));
      },
      RedisCacheService.TTL.SHORT // 1 minute - changes frequently with showtimes
    );
  }

  async findComingSoon(): Promise<any[]> {
    const cacheKey = this.cacheService.generateKey(RedisCacheService.KEYS.MOVIES, 'coming-soon');
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const movies = await this.moviesRepo.findComingSoon(now);
        return movies.map(m => this.formatMovieWithGenres(m));
      },
      RedisCacheService.TTL.MEDIUM // 5 minutes
    );
  }

  async findAll(): Promise<MovieEntity[]> {
    const cacheKey = this.cacheService.generateKey(RedisCacheService.KEYS.MOVIES, 'all');
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => this.moviesRepo.findAll(),
      RedisCacheService.TTL.MEDIUM
    );
  }

  async findOne(id: number): Promise<MovieEntity | null> {
    const cacheKey = this.cacheService.generateKey(RedisCacheService.KEYS.MOVIE, id);
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => this.moviesRepo.findById(id),
      RedisCacheService.TTL.LONG
    );
  }
}

