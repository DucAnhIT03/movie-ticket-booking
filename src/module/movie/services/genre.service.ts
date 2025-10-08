/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from '../entities/genres.entity';
import { CreateGenreDto } from '../dtos/create-genre.dto';
import { UpdateGenreDto } from '../dtos/update-genre.dto';

@Injectable()
export class GenreService {
  constructor(@InjectRepository(Genre) private repo: Repository<Genre>) {}

  async create(dto: CreateGenreDto) {
    const g = this.repo.create({ genreName: dto.genreName });
    return this.repo.save(g);
  }

  async createMany(dtos: CreateGenreDto[]) {
    if (!dtos || dtos.length === 0) return [];
    const entities = dtos.map((d) => this.repo.create({ genreName: d.genreName }));
    return this.repo.save(entities);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const g = await this.repo.findOne({ where: { id } });
    if (!g) throw new NotFoundException('Genre not found');
    return g;
  }

  async update(id: number, dto: UpdateGenreDto) {
    const g = await this.findOne(id);
    Object.assign(g, dto);
    return this.repo.save(g);
  }

  async remove(id: number) {
    const g = await this.findOne(id);
    await this.repo.remove(g);
    return { success: true };
  }
}
