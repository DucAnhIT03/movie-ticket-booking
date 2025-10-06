import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './controller/user.controller';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RolesSeeder } from './seeds/roles.seed';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, UserRole])],
  providers: [UserService, RolesSeeder],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
