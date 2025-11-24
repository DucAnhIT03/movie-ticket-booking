import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShowtimesService } from './services/showtimes.service';
import { ShowtimesController } from './controllers/showtimes.controller';
import { Showtime } from '../../shared/schemas/showtime.entity';
import { Movie } from '../../shared/schemas/movie.entity';
import { Screen } from '../../shared/schemas/screen.entity';
import { ShowtimeRepository } from './repositories/showtime.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Showtime, Movie, Screen])],
  controllers: [ShowtimesController],
  providers: [ShowtimesService, ShowtimeRepository],
  exports: [ShowtimesService],
})
export class ShowtimesModule {}
