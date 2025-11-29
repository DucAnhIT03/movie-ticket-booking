import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Nguyen' })
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ example: 'Van B' })
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'staff@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @Matches(/^(\+84|0)(3|5|7|8|9)\d{8}$/, {
    message: 'Phone must be a valid Vietnam mobile number',
  })
  phone?: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}



