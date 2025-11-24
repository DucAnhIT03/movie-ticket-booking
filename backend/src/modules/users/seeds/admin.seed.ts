import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../repositories/users.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRoleRepository } from '../repositories/user-role.repository';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    private usersRepo: UsersRepository,
    private rolesRepo: RoleRepository,
    private userRolesRepo: UserRoleRepository,
  ) {}

  async onModuleInit() {
    try {
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@cinema.com';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

      // Check existing user
      const existing = await this.usersRepo.findOne({
        where: { email: adminEmail },
      });
      if (existing) {
        this.logger.log(`Admin user already exists: ${adminEmail}`);
        // Ensure role assigned
        const role = await this.rolesRepo.findOne({
          where: { roleName: 'ROLE_ADMIN' },
        });
        if (role) {
          const ur = await this.userRolesRepo.findOne({
            where: { userId: existing.id, roleId: role.id },
          });
          if (!ur) {
            await this.userRolesRepo.save(
              this.userRolesRepo.create({
                userId: existing.id,
                roleId: role.id,
              }),
            );
            this.logger.log(
              `Assigned ROLE_ADMIN to existing admin user ${adminEmail}`,
            );
          }
        }
        return;
      }

      // Create role if missing
      let adminRole = await this.rolesRepo.findOne({
        where: { roleName: 'ROLE_ADMIN' },
      });
      if (!adminRole) {
        adminRole = await this.rolesRepo.save(
          this.rolesRepo.create({ roleName: 'ROLE_ADMIN' }),
        );
        this.logger.log('Created ROLE_ADMIN');
      }

      // Hash password and create user
      const hashed = await bcrypt.hash(adminPassword, 10);
      const user = this.usersRepo.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: hashed,
        status: undefined,
      });
      const saved = await this.usersRepo.save(user);

      // Assign admin role
      await this.userRolesRepo.save(
        this.userRolesRepo.create({ userId: saved.id, roleId: adminRole.id }),
      );
      this.logger.log(`Seeded admin user: ${adminEmail}`);
    } catch (err) {
      this.logger.error('Failed to seed admin user', err as any);
    }
  }
}
