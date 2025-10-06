/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @Matches(/^\+?\d{9,11}$/)
  phone?: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
