import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import { UserRole } from '../../../shared/schemas/user-role.entity';

@Injectable()
export class UserRoleRepository {
  constructor(
    @InjectRepository(UserRole)
    private readonly repo: Repository<UserRole>,
  ) {}

  create(data: Partial<UserRole>) {

    return this.repo.create(data as Partial<UserRole>);
  }

  save(entity: Partial<UserRole>) {
    return this.repo.save(entity as UserRole);
  }

  findOne(options: FindOneOptions<UserRole>) {
    return this.repo.findOne(options);
  }
}
