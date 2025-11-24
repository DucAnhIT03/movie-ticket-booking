import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../shared/schemas/role.entity';

@Injectable()
export class RolesSeeder implements OnModuleInit {
  private readonly logger = new Logger(RolesSeeder.name);

  constructor(
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
  ) {}

  async onModuleInit() {
    try {
      const needed: Array<'ROLE_USER' | 'ROLE_ADMIN'> = ['ROLE_USER', 'ROLE_ADMIN'];
      for (const roleName of needed) {
        const existing = await this.rolesRepo.findOne({ where: { roleName } });
        if (!existing) {
          await this.rolesRepo.save(this.rolesRepo.create({ roleName }));
          this.logger.log(`Seeded role: ${roleName}`);
        }
      }
    } catch (err) {
      this.logger.error('Failed to seed roles', err as any);
    }
  }
}
