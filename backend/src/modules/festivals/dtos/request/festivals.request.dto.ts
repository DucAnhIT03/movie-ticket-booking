import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFestivalRequestDto {
  @ApiProperty({ example: 'Lễ hội phim mùa hè', maxLength: 255, description: 'Tiêu đề lễ hội' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg', maxLength: 255, nullable: true, description: 'Ảnh banner/poster (URL)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  image?: string | null;

  @ApiPropertyOptional({ example: 'Nội dung chi tiết về lễ hội...', description: 'Nội dung mô tả lễ hội' })
  @IsString()
  @IsOptional()
  content?: string | null;

  @ApiProperty({ example: '2030-01-01T09:00:00.000Z', description: 'Thời gian bắt đầu (ISO UTC)' })
  @IsDateString()
  start_time!: string;

  @ApiProperty({ example: '2030-01-05T17:00:00.000Z', description: 'Thời gian kết thúc (ISO UTC)' })
  @IsDateString()
  end_time!: string;
}

export class UpdateFestivalRequestDto {
  @ApiPropertyOptional({ example: 'Lễ hội phim 2030', maxLength: 255, description: 'Tiêu đề lễ hội' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner-new.jpg', maxLength: 255, nullable: true, description: 'Ảnh banner/poster (URL)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  image?: string | null;

  @ApiPropertyOptional({ example: 'Nội dung chi tiết về lễ hội...', description: 'Nội dung mô tả lễ hội' })
  @IsString()
  @IsOptional()
  content?: string | null;

  @ApiPropertyOptional({ example: '2030-01-02T09:00:00.000Z', description: 'Thời gian bắt đầu (ISO UTC)' })
  @IsDateString()
  @IsOptional()
  start_time?: string;

  @ApiPropertyOptional({ example: '2030-01-06T17:00:00.000Z', description: 'Thời gian kết thúc (ISO UTC)' })
  @IsDateString()
  @IsOptional()
  end_time?: string;
}


