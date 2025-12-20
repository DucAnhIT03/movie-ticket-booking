import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class ResetWithCodeDto {
  @ApiProperty({ example: 'employee@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'A1B2C3D4' })
  @IsString()
  @Length(8, 12)
  resetCode: string;

  @ApiProperty({ example: 'newP@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

