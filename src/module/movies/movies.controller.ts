import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  findAll() {
    return this.moviesService.findAll();
  }

  @Get('status')
  findByStatus(@Query('isShowing') isShowing: string) {
    return this.moviesService.findByStatus(isShowing === 'true');
  }

  @Get('genre')
  findByGenre(@Query('genre') genre: string) {
    return this.moviesService.findByGenre(genre);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moviesService.findOne(+id);
  }

  @Post()
  create(@Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(createMovieDto);
  }
}
