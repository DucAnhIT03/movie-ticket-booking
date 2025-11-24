
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { Promotion } from '../../../shared/schemas/promotion.entity';

@Injectable()
export class PromotionRepository {
  constructor(
    @InjectRepository(Promotion)
    private readonly repo: Repository<Promotion>,
  ) {}

  create(data: Partial<Promotion>) {
    return this.repo.create(data as Partial<Promotion>);
  }

  save(entity: Partial<Promotion> | Partial<Promotion>[]) {
    return this.repo.save(entity as any);
  }

  findOne(options: FindOneOptions<Promotion>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<Promotion>) {
    return this.repo.find(options);
  }

  remove(entity: Promotion) {
    return this.repo.remove(entity);
  }

}
