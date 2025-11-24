

import { IsOptional, IsEnum, IsString, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


const validStatus = ['PENDING', 'BOOKED', 'CANCELLED', 'FAILED'];

export class FilterBookingDto {
  @ApiProperty({
    required: false,
    description: 'Lọc theo trạng thái vé',
    enum: validStatus, 
  })
  @IsOptional()
  @IsEnum(validStatus) 
  @IsString()
  status?: 'PENDING' | 'BOOKED' | 'CANCELLED' | 'FAILED';

  @ApiProperty({
    required: false,
    description: 'Số trang (bắt đầu từ 1)',
    type: String,
    example: '1',
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({
    required: false,
    description: 'Số lượng mỗi trang (tối thiểu 1, tối đa 100)',
    type: String,
    example: '10',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}

