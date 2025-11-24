import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { Showtime } from '../../../shared/schemas/showtime.entity';

@Injectable()
export class ShowtimeRepository {
  constructor(
    @InjectRepository(Showtime)
    private readonly repo: Repository<Showtime>,
  ) {}

  create(data: Partial<Showtime>) {
    return this.repo.create(data as Partial<Showtime>);
  }

  save(entity: Partial<Showtime> | Partial<Showtime>[]) {
    return this.repo.save(entity as any);
  }

  findOne(options: FindOneOptions<Showtime>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<Showtime>) {
    return this.repo.find(options);
  }

  remove(entity: Showtime) {
    return this.repo.remove(entity);
  }

  update(id: number, partial: Partial<Showtime>) {
    return this.repo.update(id, partial);
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }
}

