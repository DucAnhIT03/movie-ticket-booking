import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { Payment } from '../../../shared/schemas/payment.entity';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  create(data: Partial<Payment>) {
    return this.repo.create(data as Partial<Payment>);
  }

  save(entity: Partial<Payment> | Partial<Payment>[]) {
    return this.repo.save(entity as any);
  }

  findOne(options: FindOneOptions<Payment>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<Payment>) {
    return this.repo.find(options);
  }

  remove(entity: Payment) {
    return this.repo.remove(entity);
  }

  update(id: number, partial: Partial<Payment>) {
    return this.repo.update(id, partial);
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }

  delete(criteria: any) {
    return this.repo.delete(criteria);
  }
}

