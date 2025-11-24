import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { TicketPrice } from '../../../shared/schemas/ticket-price.entity';

@Injectable()
export class TicketPriceRepository {
  constructor(
    @InjectRepository(TicketPrice)
    private readonly repo: Repository<TicketPrice>,
  ) {}

  create(data: Partial<TicketPrice>) {
    return this.repo.create(data as Partial<TicketPrice>);
  }

  save(entity: Partial<TicketPrice> | Partial<TicketPrice>[]) {
    return this.repo.save(entity as any);
  }

  findOne(options: FindOneOptions<TicketPrice>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<TicketPrice>) {
    return this.repo.find(options);
  }

  findAndCount(options?: FindManyOptions<TicketPrice>) {
    return this.repo.findAndCount(options);
  }

  count(options?: FindManyOptions<TicketPrice>) {
    return this.repo.count(options);
  }

  remove(entity: TicketPrice) {
    return this.repo.remove(entity);
  }

  update(id: number, partial: Partial<TicketPrice>) {
    return this.repo.update(id, partial);
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }
}

