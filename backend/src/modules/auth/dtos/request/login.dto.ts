import { IsEmail, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @Matches(/^(\+84|0)(3|5|7|8|9)\d{8}$/, {
    message:
      'Phone must be a valid Vietnam mobile number (start with 0 or +84 and valid operator)',
  })
  phone?: string;

  @ApiProperty({ example: 'P@ssw0rd' })
  @IsNotEmpty()
  password: string;
}
