
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { UserPromotion } from '../../../shared/schemas/user-promotion.entity';

@Injectable()
export class UserPromotionRepository {
  constructor(
    @InjectRepository(UserPromotion)
    private readonly repo: Repository<UserPromotion>,
  ) {}

  create(data: Partial<UserPromotion>) {
    return this.repo.create(data as Partial<UserPromotion>);
  }

  save(entity: Partial<UserPromotion> | Partial<UserPromotion>[]) {
    return this.repo.save(entity as any);
  }

  findOne(options: FindOneOptions<UserPromotion>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<UserPromotion>) {
    return this.repo.find(options);
  }

  remove(entity: UserPromotion) {
    return this.repo.remove(entity);
  }
}
