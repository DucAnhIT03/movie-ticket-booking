/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { MovieService } from '../services/movie.service';
import { CreateMovieDto } from '../dtos/create-movie.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Controller('movies')
export class MovieController {
  constructor(private service: MovieService) {}

  @Post()
  async create(@Body() dto: any) {
    if (Array.isArray(dto)) {
      // validate each item using class-validator
      const instances = plainToInstance(CreateMovieDto, dto as object[]);
      const errors = [] as string[];
      for (const inst of instances) {
        // eslint-disable-next-line no-await-in-loop
        const errs = await validate(inst as any);
        if (errs.length) {
          errors.push(
            ...errs.map((e) => Object.values(e.constraints || {}).join(', ')),
          );
        }
      }
      if (errors.length) throw new BadRequestException(errors);
      return this.service.createMany(instances as CreateMovieDto[]);
    }
    // single
    const inst = plainToInstance(CreateMovieDto, dto as object);
    const errs = await validate(inst as any);
    if (errs.length)
      throw new BadRequestException(
        errs.map((e) => Object.values(e.constraints || {}).join(', ')),
      );
    return this.service.create(inst as CreateMovieDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  // movie-genre endpoints
  @Post(':id/genres')
  addGenre(@Param('id') id: string, @Body() body: { genreId: number }) {
    return this.service.addGenre(Number(id), body.genreId);
  }

  @Delete(':id/genres/:genreId')
  removeGenre(@Param('id') id: string, @Param('genreId') genreId: string) {
    return this.service.removeGenre(Number(id), Number(genreId));
  }

  @Get(':id/genres')
  getGenres(@Param('id') id: string) {
    return this.service.getGenresForMovie(Number(id));
  }
}
