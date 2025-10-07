import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';

@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Get()
  findAll() {
    return this.showtimesService.findAll();
  }

  @Get('movie/:movieId')
  findByMovie(@Param('movieId') movieId: string) {
    return this.showtimesService.findByMovie(+movieId);
  }

  @Get('date')
  findByDate(@Query('date') date: string) {
    return this.showtimesService.findByDate(date);
  }

  @Get('room')
  findByRoom(@Query('room') room: string) {
    return this.showtimesService.findByRoom(room);
  }

  @Post()
  create(@Body() dto: CreateShowtimeDto) {
    return this.showtimesService.create(dto);
  }
}
