import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { Booking } from '../../../shared/schemas/booking.entity';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
  ) {}

  create(data: Partial<Booking>) {
    return this.repo.create(data as Partial<Booking>);
  }

  save(entity: Partial<Booking> | Partial<Booking>[]) {
    return this.repo.save(entity as any);
  }

  findOne(options: FindOneOptions<Booking>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<Booking>) {
    return this.repo.find(options);
  }

  remove(entity: Booking) {
    return this.repo.remove(entity);
  }

  update(id: number, partial: Partial<Booking>) {
    return this.repo.update(id, partial);
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }
}

