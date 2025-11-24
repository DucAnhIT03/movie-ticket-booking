import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersRepository } from '../../modules/users/repositories/users.repository';
import { Users } from '../../shared/schemas/users.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      throw new UnauthorizedException('Authentication required');
    }


    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.sub) {
      throw new UnauthorizedException('User not found in request');
    }


    const userRepo = this.dataSource.getRepository(Users);
    const userWithRoles = await userRepo.findOne({
      where: { id: user.sub },
      relations: ['roles', 'roles.role'],
    });

    if (!userWithRoles) {
      throw new UnauthorizedException('User not found');
    }

    // Kiểm tra tài khoản có bị khóa không
    if (userWithRoles.status === 'BLOCKED') {
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }

    const roleNames = (userWithRoles.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);

    if (!roleNames.includes('ROLE_ADMIN')) {
      throw new ForbiddenException('Only admin can access this endpoint');
    }

    request.user.roles = roleNames;

    return true;
  }
}

