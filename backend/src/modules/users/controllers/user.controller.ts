
import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Post,
  Param,
  ForbiddenException,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation, ApiResponse, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CacheResponse, InvalidateCache } from '../../../providers/redis-cache';
import { RedisCacheService } from '../../../providers/redis-cache/redis-cache.service';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { UpdateProfileDto } from '../../auth/dtos/request/update-profile.dto';
import { ChangePasswordDto } from '../../auth/dtos/request/change-password.dto';
import { AssignRoleDto } from '../dtos/request/assign-role.dto';
import { UserResponseDto } from '../dtos/response/user.response.dto';
import { CloudinaryService } from '../../../providers/cloudinary/cloudinary.service';
import { CreateEmployeeDto } from '../dtos/request/create-employee.dto';

function validateImageFile(file: Express.Multer.File): void {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; 

  if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException(`File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new BadRequestException(`File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`);
  }
}

@ApiTags('Users')
@ApiBearerAuth('jwt')
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @CacheResponse(`${RedisCacheService.KEYS.USER_PROFILE}:me`, RedisCacheService.TTL.USER_PROFILE)
  @ApiOperation({ 
    summary: 'Lấy thông tin người dùng hiện tại',
    description: 'Lấy thông tin của người dùng đang đăng nhập (từ JWT token)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Thông tin người dùng',
    type: UserResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async me(@Request() req: any) {
    if (!req || !req.user) throw new UnauthorizedException();
    const user = await this.userService.findById(req.user.sub);
    return UserResponseDto.fromEntity(user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @InvalidateCache(`${RedisCacheService.KEYS.USER_PROFILE}:me`)
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân (hỗ trợ upload ảnh avatar)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Cập nhật thành công', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh avatar (tùy chọn)',
        },
        firstName: { type: 'string', example: 'Nguyen' },
        lastName: { type: 'string', example: 'Van A' },
        email: { type: 'string', example: 'example@gmail.com' },
        avatar: { type: 'string', example: 'https://example.com/avatar.jpg', description: 'URL avatar (nếu không upload file)' },
        phone: { type: 'string', example: '0912345678' },
        address: { type: 'string', example: '123 Main St, Hanoi' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async update(
    @Request() req: any,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!req || !req.user) throw new UnauthorizedException();
    
    // Tạo DTO từ body (có thể là string từ form-data hoặc object từ JSON)
    const dto: UpdateProfileDto = {
      firstName: body.firstName || undefined,
      lastName: body.lastName || undefined,
      email: body.email || undefined,
      avatar: body.avatar || undefined,
      phone: body.phone || undefined,
      address: body.address || undefined,
    };
    
    // Nếu có file upload, upload lên Cloudinary và lấy URL (ưu tiên file hơn URL trong body)
    if (file?.buffer) {
      validateImageFile(file);
      try {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          'users/avatars',
        );
        dto.avatar = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload avatar failed');
      }
    }
    
    const updatedUser = await this.userService.updateProfile(req.user.sub, dto);
    return UserResponseDto.fromEntity(updatedUser);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu cũ không đúng' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      basic: {
        summary: 'Change password example',
        value: {
          currentPassword: 'oldPassword123',
          newPassword: 'newP@ssw0rd',
        },
      },
    },
  })
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    if (!req || !req.user) throw new UnauthorizedException();
    return this.userService.changePassword(req.user.sub, dto);
  }

  @UseGuards(AdminGuard)
  @Post('employees')
  @ApiOperation({ summary: 'Tạo tài khoản nhân viên - Chỉ admin' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Tạo tài khoản nhân viên thành công', type: UserResponseDto })
  async createEmployee(@Body() dto: CreateEmployeeDto) {
    const result = await this.userService.createEmployeeAccount(dto);
    return UserResponseDto.fromEntity(result);
  }

  @UseGuards(AdminGuard)
  @Post(':id/roles')
  @ApiOperation({ summary: 'Gán vai trò cho người dùng - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiBody({ type: AssignRoleDto })
  @ApiResponse({ status: 200, description: 'Gán vai trò thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async assignRole(
    @Request() req: any,
    @Body() dto: AssignRoleDto,
    @Param('id') id: string,
  ) {
    return this.userService.assignRoleToUser(Number(id), dto.role);
  }

  @UseGuards(AdminGuard)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng - Chỉ admin' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng', type: [UserResponseDto] })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async findAll(@Request() req: any) {
    const users = await this.userService.findAllNonAdmin();
    return users.map(user => UserResponseDto.fromEntity(user));
  }

  @UseGuards(AdminGuard)
  @Patch(':id/block')
  @ApiOperation({ summary: 'Khóa tài khoản người dùng - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của người dùng cần khóa', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Khóa tài khoản thành công',
    schema: {
      example: {
        success: true,
        message: 'Đã khóa tài khoản thành công',
        user: {
          id: 1,
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'user@example.com',
          status: 'BLOCKED',
          roles: ['ROLE_USER']
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Tài khoản đã bị khóa' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async blockUser(@Param('id') id: string) {
    return this.userService.blockUser(Number(id));
  }

  @UseGuards(AdminGuard)
  @Patch(':id/unblock')
  @ApiOperation({ summary: 'Mở khóa tài khoản người dùng - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của người dùng cần mở khóa', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Mở khóa tài khoản thành công',
    schema: {
      example: {
        success: true,
        message: 'Đã mở khóa tài khoản thành công',
        user: {
          id: 1,
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'user@example.com',
          status: 'ACTIVE',
          roles: ['ROLE_USER']
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Tài khoản đã được mở khóa' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async unblockUser(@Param('id') id: string) {
    return this.userService.unblockUser(Number(id));
  }

  @UseGuards(AdminGuard)
  @Patch(':id/theater')
  @ApiOperation({ summary: 'Gán rạp cho nhân viên - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        theaterId: {
          type: 'number',
          nullable: true,
          description: 'ID của rạp phim (null để gỡ rạp)',
          example: 1
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Gán rạp thành công',
    schema: {
      example: {
        success: true,
        message: 'Đã gán rạp thành công',
        user: {
          id: 1,
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'employee@example.com',
          theaterId: 1,
          roles: ['ROLE_EMPLOYEE']
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Chỉ có thể gán rạp cho nhân viên' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async assignTheater(
    @Param('id') id: string,
    @Body() body: { theaterId: number | null }
  ) {
    return this.userService.assignTheater(Number(id), body.theaterId);
  }
}
