/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from '../../auth/dtos/update-profile.dto';
import { ChangePasswordDto } from '../../auth/dtos/change-password.dto';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private userRolesRepo: Repository<UserRole>,
  ) {}

  async findById(id: number) {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.role'],
    });
    if (!user) throw new NotFoundException('User not found');
    // map role names
    const roleNames = (user.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = user as any;
    return { ...profile, roles: roleNames };
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, dto);
    const saved = await this.usersRepo.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = saved as any;
    return profile;
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) throw new BadRequestException('Current password is incorrect');
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.save(user);
    return { success: true };
  }

  async assignRoleToUser(userId: number, roleName: string) {
    const role = await this.rolesRepo.findOne({ where: { roleName } });
    if (!role) throw new NotFoundException('Role not found');
    const exists = await this.userRolesRepo.findOne({
      where: { userId, roleId: role.id },
    });
    if (!exists) {
      await this.userRolesRepo.save(
        this.userRolesRepo.create({ userId, roleId: role.id }),
      );
    }
    return { success: true };
  }
}
