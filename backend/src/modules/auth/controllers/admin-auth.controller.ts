import { Controller, Post, Body, HttpCode, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/request/login.dto';

@ApiTags('🔐 Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(200)
  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập Admin',
    description: 'Đăng nhập dành riêng cho quản trị viên. Chỉ tài khoản có role ROLE_ADMIN mới được phép đăng nhập.'
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'admin@cinema.com',
          firstName: 'Admin',
          lastName: 'User',
          roles: ['ROLE_ADMIN']
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Thông tin đăng nhập không đúng hoặc không có quyền admin',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials or insufficient permissions',
        error: 'Unauthorized'
      }
    }
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      adminLogin: {
        summary: 'Admin login',
        value: { email: 'admin@cinema.com', password: 'admin123' },
      },
    },
  })
  async adminLogin(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto, { allowAdmin: true });
    
   
    const userRoles = result.user?.roles || [];
    const canAccessBackoffice = userRoles.some((role) =>
      ['ROLE_ADMIN', 'ROLE_EMPLOYEE', 'ADMIN', 'admin', 'EMPLOYEE', 'employee'].includes(role),
    );

    if (!canAccessBackoffice) {
      throw new UnauthorizedException(
        'Bạn không có quyền truy cập trang quản trị. Chỉ tài khoản admin hoặc nhân viên được phép đăng nhập.',
      );
    }

    return result;
  }
}


