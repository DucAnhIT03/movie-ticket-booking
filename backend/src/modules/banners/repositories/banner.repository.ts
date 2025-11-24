import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { Banner } from '../../../shared/schemas/banners.entity';

@Injectable()
export class BannerRepository {
  constructor(
    @InjectRepository(Banner)
    private readonly repo: Repository<Banner>,
  ) {}

  create(data: Partial<Banner>) {
    return this.repo.create(data as Partial<Banner>);
  }

  save(entity: Partial<Banner>) {
    return this.repo.save(entity as Banner);
  }

  findOne(options: FindOneOptions<Banner>) {
    return this.repo.findOne(options);
  }

  update(id: number, partial: Partial<Banner>) {
    return this.repo.update(id, partial);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }

  remove(entity: Banner) {
    return this.repo.remove(entity);
  }

  findAndCount(options: FindManyOptions<Banner>) {
    return this.repo.findAndCount(options);
  }

  find(options?: FindManyOptions<Banner>) {
    return this.repo.find(options);
  }
}
