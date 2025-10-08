/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { GenreService } from '../services/genre.service';
import { CreateGenreDto } from '../dtos/create-genre.dto';
import { UpdateGenreDto } from '../dtos/update-genre.dto';
import { BadRequestException } from '@nestjs/common';

@Controller('genres')
export class GenreController {
  constructor(private service: GenreService) {}

  @Post()
  async create(@Body() dto: any) {
    if (Array.isArray(dto)) {
      for (const item of dto) {
        if (!item || typeof item.genreName !== 'string' || item.genreName.trim() === '') {
          throw new BadRequestException('Each genre must have a non-empty genreName string');
        }
      }
      return this.service.createMany(dto as CreateGenreDto[]);
    }
    return this.service.create(dto as CreateGenreDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGenreDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
