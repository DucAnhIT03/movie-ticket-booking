
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { Movie } from '../../../shared/schemas/movie.entity';

@Injectable()
export class MovieRepository {
  constructor(
    @InjectRepository(Movie)
    private readonly repo: Repository<Movie>,
  ) {}

  create(data: Partial<Movie>) {
    return this.repo.create(data as Partial<Movie>);
  }

  save(entity: Partial<Movie> | Partial<Movie>[]) {
    return this.repo.save(entity as any);
  }

  findOne(options: FindOneOptions<Movie>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<Movie>) {
    return this.repo.find(options);
  }

  remove(entity: Movie) {
    return this.repo.remove(entity);
  }

  update(id: number, partial: Partial<Movie>) {
    return this.repo.update(id, partial);
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }
}
