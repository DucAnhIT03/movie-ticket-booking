
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { Genre } from '../../../shared/schemas/genres.entity';

@Injectable()
export class GenreRepository {
  constructor(
    @InjectRepository(Genre)
    private readonly repo: Repository<Genre>,
  ) {}

  create(data: Partial<Genre>) {
    return this.repo.create(data as Partial<Genre>);
  }

  save(entity: Partial<Genre> | Partial<Genre>[]) {
    return this.repo.save(entity as any);
  }

  findOne(options: FindOneOptions<Genre>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<Genre>) {
    return this.repo.find(options);
  }

  remove(entity: Genre) {
    return this.repo.remove(entity);
  }

  update(id: number, partial: Partial<Genre>) {
    return this.repo.update(id, partial);
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }
}
