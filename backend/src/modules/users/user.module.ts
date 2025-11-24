import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UsersRepository } from './repositories/users.repository';
import { RoleRepository } from './repositories/role.repository';
import { UserRoleRepository } from './repositories/user-role.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../../shared/schemas/users.entity';
import { UserController } from './controllers/user.controller';
import { Role } from '../../shared/schemas/role.entity';
import { UserRole } from '../../shared/schemas/user-role.entity';
import { RolesSeeder } from './seeds/roles.seed';
import { AdminSeeder } from './seeds/admin.seed';
import { CloudinaryModule } from '../../providers/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Role, UserRole]), CloudinaryModule],
  providers: [
    UserService,
    RolesSeeder,
    AdminSeeder,
    UsersRepository,
    RoleRepository,
    UserRoleRepository,
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
