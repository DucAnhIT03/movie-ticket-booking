import { IsEmail, IsOptional, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^\+?\d{9,11}$/)
  phone?: string;

  @IsOptional()
  address?: string;
}
