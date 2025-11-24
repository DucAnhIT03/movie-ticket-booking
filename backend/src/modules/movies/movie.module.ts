import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../../shared/schemas/movie.entity';
import { Genre } from '../../shared/schemas/genres.entity';
import { MovieGenre } from '../../shared/schemas/movie-genre.entity';
import { Showtime } from '../../shared/schemas/showtime.entity';
import { Booking } from '../../shared/schemas/booking.entity';
import { MovieService } from './services/movie.service';
import { MovieController } from './controllers/movie.controller';
import { GenreService } from './services/genre.service';
import { GenreController } from './controllers/genre.controller';
import { MovieRepository } from './repositories/movie.repository';
import { GenreRepository } from './repositories/genre.repository';
import { MovieGenreRepository } from './repositories/movie-genre.repository';
import { CloudinaryModule } from '../../providers/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Genre, MovieGenre, Showtime, Booking]), CloudinaryModule],
  providers: [
    MovieService,
    GenreService,
    MovieRepository,
    GenreRepository,
    MovieGenreRepository,
  ],
  controllers: [MovieController, GenreController],
  exports: [MovieService, GenreService],
})
export class MovieModule {}
