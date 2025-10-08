import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { Genre } from './entities/genres.entity';
import { MovieGenre } from './entities/movie-genre.entity';
import { MovieService } from './services/movie.service';
import { MovieController } from './controllers/movie.controller';
import { GenreService } from './services/genre.service';
import { GenreController } from './controllers/genre.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Genre, MovieGenre])],
  providers: [MovieService, GenreService],
  controllers: [MovieController, GenreController],
  exports: [MovieService, GenreService],
})
export class MovieModule {}
