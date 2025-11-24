import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { Users } from '../../../shared/schemas/users.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(Users)
    private readonly repo: Repository<Users>,
  ) {}

  create(data: Partial<Users>) {
    return this.repo.create(data as Partial<Users>);
  }

  save(entity: Partial<Users>) {
    return this.repo.save(entity as Users);
  }

  findOne(options: FindOneOptions<Users>) {
    return this.repo.findOne(options);
  }

  find(options?: FindManyOptions<Users>) {
    return this.repo.find(options);
  }

  update(id: number, partial: Partial<Users>) {
    return this.repo.update(id, partial);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}
