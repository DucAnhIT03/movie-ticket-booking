import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyen' })
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ example: 'Van A' })
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @Matches(/^(\+84|0)(3|5|7|8|9)\d{8}$/, {
    message:
      'Phone must be a valid Vietnam mobile number (start with 0 or +84 and valid operator)',
  })
  phone?: string;

  @ApiProperty({ example: 'P@ssw0rd' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
