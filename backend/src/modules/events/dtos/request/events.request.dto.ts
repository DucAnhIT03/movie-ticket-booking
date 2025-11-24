import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventRequestDto {
  @ApiProperty({ example: 'Sự kiện ra mắt phim mới', maxLength: 255, description: 'Tiêu đề sự kiện' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Mô tả chi tiết về sự kiện...', description: 'Mô tả sự kiện' })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/event.jpg', maxLength: 255, nullable: true, description: 'Ảnh sự kiện (URL)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  image?: string | null;

  @ApiPropertyOptional({ example: 'Rạp CGV Vincom', maxLength: 255, nullable: true, description: 'Địa điểm tổ chức' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string | null;

  @ApiProperty({ example: '2030-01-01T09:00:00.000Z', description: 'Thời gian bắt đầu (ISO UTC)' })
  @IsDateString()
  start_time!: string;

  @ApiProperty({ example: '2030-01-05T17:00:00.000Z', description: 'Thời gian kết thúc (ISO UTC)' })
  @IsDateString()
  end_time!: string;

  @ApiPropertyOptional({ 
    example: 'UPCOMING', 
    enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    description: 'Trạng thái sự kiện',
    default: 'UPCOMING'
  })
  @IsEnum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
  @IsOptional()
  status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

export class UpdateEventRequestDto {
  @ApiPropertyOptional({ example: 'Sự kiện ra mắt phim mới 2025', maxLength: 255, description: 'Tiêu đề sự kiện' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Mô tả chi tiết về sự kiện...', description: 'Mô tả sự kiện' })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/event-new.jpg', maxLength: 255, nullable: true, description: 'Ảnh sự kiện (URL)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  image?: string | null;

  @ApiPropertyOptional({ example: 'Rạp CGV Vincom Landmark', maxLength: 255, nullable: true, description: 'Địa điểm tổ chức' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string | null;

  @ApiPropertyOptional({ example: '2030-01-02T09:00:00.000Z', description: 'Thời gian bắt đầu (ISO UTC)' })
  @IsDateString()
  @IsOptional()
  start_time?: string;

  @ApiPropertyOptional({ example: '2030-01-06T17:00:00.000Z', description: 'Thời gian kết thúc (ISO UTC)' })
  @IsDateString()
  @IsOptional()
  end_time?: string;

  @ApiPropertyOptional({ 
    example: 'ONGOING', 
    enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    description: 'Trạng thái sự kiện'
  })
  @IsEnum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
  @IsOptional()
  status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}


