import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({ example: 'ROLE_ADMIN', description: 'Tên vai trò cần gán' })
  @IsNotEmpty()
  @IsString()
  role: string;
}

