import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class AddGenreDto {
  @ApiPropertyOptional({ example: 2, description: 'ID thể loại (tùy chọn nếu có genreName)' })
  @IsOptional()
  @IsInt()
  @Expose({ name: 'genre_id' })
  genreId?: number;

  @ApiPropertyOptional({ example: 'Action', description: 'Tên thể loại (tùy chọn nếu có genreId)' })
  @IsOptional()
  @IsString()
  genreName?: string;
}



