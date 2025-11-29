import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({
    example: 'ROLE_EMPLOYEE',
    description: 'Tên vai trò cần gán',
    enum: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_EMPLOYEE'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['ROLE_USER', 'ROLE_ADMIN', 'ROLE_EMPLOYEE'])
  role: string;
}

