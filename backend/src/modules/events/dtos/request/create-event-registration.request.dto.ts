import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';

export class CreateEventRegistrationRequestDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ tên người đăng ký' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  full_name!: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email liên hệ' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: '0987654321', description: 'Số điện thoại' })
  @IsPhoneNumber('VN')
  phone!: string;

  @ApiPropertyOptional({ example: 'Muốn đăng ký 2 vé', description: 'Ghi chú thêm' })
  @IsOptional()
  @IsString()
  note?: string | null;
}




