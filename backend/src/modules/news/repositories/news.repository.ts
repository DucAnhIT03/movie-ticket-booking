
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { News } from '../../../shared/schemas/news.entity';

@Injectable()
export class NewsRepository {
  constructor(
    @InjectRepository(News)
    private readonly repo: Repository<News>,
  ) {}

  create(data: Partial<News>) {
    return this.repo.create(data as Partial<News>);
  }

  save(entity: Partial<News>) {
    return this.repo.save(entity as News);
  }

  findOne(options: FindOneOptions<News>) {
    return this.repo.findOne(options);
  }

  update(id: number, partial: Partial<News>) {
    return this.repo.update(id, partial);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }

  findAndCount(options: FindManyOptions<News>) {
    return this.repo.findAndCount(options);
  }

  find(options?: FindManyOptions<News>) {
    return this.repo.find(options);
  }
}
