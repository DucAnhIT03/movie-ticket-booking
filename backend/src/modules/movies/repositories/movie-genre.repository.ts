
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { MovieGenre } from '../../../shared/schemas/movie-genre.entity';

@Injectable()
export class MovieGenreRepository {
  constructor(
    @InjectRepository(MovieGenre)
    private readonly repo: Repository<MovieGenre>,
  ) {}

  create(data: Partial<MovieGenre>) {
    return this.repo.create(data as Partial<MovieGenre>);
  }

  save(entity: Partial<MovieGenre>) {
    return this.repo.save(entity as MovieGenre);
  }

  findOne(options: FindOneOptions<MovieGenre>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<MovieGenre>) {
    return this.repo.find(options);
  }

  remove(entity: MovieGenre) {
    return this.repo.remove(entity);
  }

  countByGenreId(genreId: number) {
    return this.repo.count({ where: { genreId } });
  }
}
