import { IsEmail, IsNotEmpty, IsString, Length, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OtpPurpose } from '../../../../shared/schemas/otp-verification.entity';

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otpCode: string;

  @ApiPropertyOptional({ 
    enum: OtpPurpose,
    default: OtpPurpose.REGISTER,
    example: OtpPurpose.REGISTER 
  })
  @IsOptional()
  @IsEnum(OtpPurpose)
  purpose?: OtpPurpose;
}


