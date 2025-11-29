import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Users } from '../../shared/schemas/users.entity';

@Injectable()
export class StaffGuard extends JwtAuthGuard implements CanActivate {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

    if (userWithRoles.status === 'BLOCKED') {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
      );
    }

    const roleNames = (userWithRoles.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);

    const hasPermission = roleNames.includes('ROLE_ADMIN') || roleNames.includes('ROLE_EMPLOYEE');
    if (!hasPermission) {
      throw new ForbiddenException('Only admin or employee can access this endpoint');
    }

    request.user.roles = roleNames;

    return true;
  }
}



