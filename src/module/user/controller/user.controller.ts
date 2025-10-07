/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Post,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { UpdateProfileDto } from '../../auth/dtos/update-profile.dto';
import { ChangePasswordDto } from '../../auth/dtos/change-password.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.userService.findById(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.sub, dto);
  }

  // Admin-only endpoint to assign a role to a user
  @UseGuards(JwtAuthGuard)
  @Post(':id/roles')
  async assignRole(
    @Request() req: any,
    @Body() body: { role: string },
    @Param('id') id: string,
  ) {
    const caller = await this.userService.findById(req.user.sub);
    if (!caller.roles || !caller.roles.includes('ROLE_ADMIN')) {
      throw new ForbiddenException('Only admin can assign roles');
    }
    return this.userService.assignRoleToUser(Number(id), body.role);
  }
}
