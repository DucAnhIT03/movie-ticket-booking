import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OtpPurpose } from '../../../../shared/schemas/otp-verification.entity';

export class SendOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ 
    enum: OtpPurpose,
    default: OtpPurpose.REGISTER,
    example: OtpPurpose.REGISTER 
  })
  @IsOptional()
  @IsEnum(OtpPurpose)
  purpose?: OtpPurpose;
}


