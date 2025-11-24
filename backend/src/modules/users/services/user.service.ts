import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from '../../auth/dtos/request/update-profile.dto';
import { ChangePasswordDto } from '../../auth/dtos/request/change-password.dto';
import { UsersRepository } from '../repositories/users.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { Status } from '../../../common/constants/enums';

@Injectable()
export class UserService {
  constructor(
    private usersRepo: UsersRepository,
    private rolesRepo: RoleRepository,
    private userRolesRepo: UserRoleRepository,
  ) {}

  async findById(id: number) {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.role'],
    });
    if (!user) throw new NotFoundException('User not found');
    const roleNames = (user.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = user as any;
    return { ...profile, roles: roleNames };
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    const user = await this.usersRepo.findOne({ 
      where: { id },
      relations: ['roles', 'roles.role'],
    });
    if (!user) throw new NotFoundException('User not found');
    
    // Chỉ cập nhật các field có giá trị trong dto
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.address !== undefined) user.address = dto.address;
    
    const saved = await this.usersRepo.save(user);
    
    // Reload với relations để trả về đầy đủ thông tin
    const updatedUser = await this.usersRepo.findOne({
      where: { id: saved.id },
      relations: ['roles', 'roles.role'],
    });
    
    const roleNames = (updatedUser?.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = updatedUser as any;
    return { ...profile, roles: roleNames };
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
    // Validate roleName is a valid role
    if (roleName !== 'ROLE_ADMIN' && roleName !== 'ROLE_USER') {
      throw new BadRequestException('Invalid role name');
    }
    const role = await this.rolesRepo.findOne({ 
      where: { roleName: roleName as 'ROLE_ADMIN' | 'ROLE_USER' } 
    });
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

  async findAll() {
    const users = await this.usersRepo.find({
      relations: ['roles', 'roles.role'],
    });
    return users.map((user) => {
      const roleNames = (user.roles || [])
        .map((ur) => ur.role?.roleName)
        .filter(Boolean);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...profile } = user as any;
      return { ...profile, roles: roleNames };
    });
  }

  async blockUser(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    if (user.status === Status.BLOCKED) {
      throw new BadRequestException('Tài khoản đã bị khóa');
    }
    
    user.status = Status.BLOCKED;
    await this.usersRepo.save(user);
    
    return { 
      success: true, 
      message: 'Đã khóa tài khoản thành công',
      user: await this.findById(userId)
    };
  }

  async unblockUser(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    if (user.status === Status.ACTIVE) {
      throw new BadRequestException('Tài khoản đã được mở khóa');
    }
    
    user.status = Status.ACTIVE;
    await this.usersRepo.save(user);
    
    return { 
      success: true, 
      message: 'Đã mở khóa tài khoản thành công',
      user: await this.findById(userId)
    };
  }
}
