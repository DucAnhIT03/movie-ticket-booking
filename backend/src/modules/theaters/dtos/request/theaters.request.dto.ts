import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PHONE_VN_REGEX } from '../../../../common/constants/regex';

export class CreateTheaterRequestDto {
  @ApiProperty({ example: 'CGV Vincom', description: 'Tên rạp chiếu' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '54 Nguyễn Trãi, Hà Nội', description: 'Địa chỉ rạp' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ example: '0912345678', description: 'Số điện thoại (VN)' })
  @IsString()
  @Matches(PHONE_VN_REGEX)
  phone!: string;
}

export class UpdateTheaterRequestDto {
  @ApiPropertyOptional({ example: 'BHD Star', description: 'Tên rạp mới' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Vincom Times City', description: 'Địa chỉ mới' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '0987654321', description: 'SĐT mới (VN)' })
  @IsOptional()
  @IsString()
  @Matches(PHONE_VN_REGEX)
  phone?: string;
}


