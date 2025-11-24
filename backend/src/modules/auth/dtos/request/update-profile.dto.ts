import { IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyen' })
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Van A' })
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'example@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @Matches(/^(\+84|0)(3|5|7|8|9)\d{8}$/, {
    message:
      'Phone must be a valid Vietnam mobile number (start with 0 or +84 and valid operator)',
  })
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St, Hanoi' })
  @IsOptional()
  address?: string;
}
