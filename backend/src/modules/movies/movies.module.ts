import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesController } from './controllers/movies.controller';
import { MoviesService } from './services/movies.service';
import { MoviesRepository } from './repositories/movies.repository';
import { Movie } from '../../shared/schemas/movie.entity';
import { Showtime } from '../../shared/schemas/showtime.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Showtime])],
  controllers: [MoviesController],
  providers: [MoviesService, MoviesRepository],
  exports: [MoviesService, MoviesRepository],
})
export class MoviesModule {}

