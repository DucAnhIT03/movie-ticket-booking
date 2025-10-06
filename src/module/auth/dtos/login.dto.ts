import { IsEmail, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^\+?\d{9,11}$/)
  phone?: string;

  @IsNotEmpty()
  password: string;
}
