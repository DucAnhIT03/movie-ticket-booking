import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePosterDto {
  @ApiPropertyOptional({ example: 'https://example.com/poster.jpg', maxLength: 500, description: 'URL ảnh poster' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  image_url?: string | null;
}



