import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'newP@ssw0rd' })
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
