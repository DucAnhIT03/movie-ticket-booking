import { IsInt, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateNewsDto {
  @ApiProperty({ example: 'Festival Opening' })
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Today the festival opens with...' })
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'URL ảnh tin tức' })
  @IsOptional()
  @MaxLength(500)
  image?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID lễ hội' })
  @IsOptional()
  @IsInt()
  @Expose({ name: 'festival_id' })
  festivalId?: number;
}
