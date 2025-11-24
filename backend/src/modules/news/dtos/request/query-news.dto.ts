import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryNewsDto {
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Search term to match title or content',
    type: String,
  })
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    type: Number,
    default: 1,
  })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Items per page',
    type: Number,
    default: 2,
  })
  limit?: number = 2;
}
