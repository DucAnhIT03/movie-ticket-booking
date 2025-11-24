import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { BookingSeat } from '../../../shared/schemas/booking-seat.entity';

@Injectable()
export class BookingSeatRepository {
  constructor(
    @InjectRepository(BookingSeat)
    private readonly repo: Repository<BookingSeat>,
  ) {}

  create(data: Partial<BookingSeat>) {
    return this.repo.create(data as Partial<BookingSeat>);
  }

  save(entity: Partial<BookingSeat> | Partial<BookingSeat>[]) {
    return this.repo.save(entity as any);
  }

  findOne(options: FindOneOptions<BookingSeat>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<BookingSeat>) {
    return this.repo.find(options);
  }

  remove(entity: BookingSeat) {
    return this.repo.remove(entity);
  }

  update(id: number, partial: Partial<BookingSeat>) {
    return this.repo.update(id, partial);
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }
}

