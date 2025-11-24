/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import { Role } from '../../../shared/schemas/role.entity';

@Injectable()
export class RoleRepository {
  create(arg0: { roleName: string; }): Partial<Role> {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
  ) {}

  findOne(options: FindOneOptions<Role>) {
    return this.repo.findOne(options);
  }

  save(entity: Partial<Role>) {
    return this.repo.save(entity as Role);
  }
}
