import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { Seat } from '../../../shared/schemas/seat.entity';

@Injectable()
export class SeatRepository {
  constructor(
    @InjectRepository(Seat)
    private readonly repo: Repository<Seat>,
  ) {}

  create(data: Partial<Seat>) {
    return this.repo.create(data as Partial<Seat>);
  }

  save(entity: Partial<Seat> | Partial<Seat>[]) {
    return this.repo.save(entity as any);
  }

  findOne(options: FindOneOptions<Seat>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<Seat>) {
    return this.repo.find(options);
  }

  remove(entity: Seat) {
    return this.repo.remove(entity);
  }

  update(id: number, partial: Partial<Seat>) {
    return this.repo.update(id, partial);
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }
}

