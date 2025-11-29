import {
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MovieType } from 'src/common/constants/enums';

export class UpdateMovieDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'The Great Adventure', description: 'Tên phim' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'An action movie about ...', description: 'Mô tả phim' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ example: 'John Doe', description: 'Tác giả/Đạo diễn' })
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ example: 'Việt Nam', description: 'Quốc gia sản xuất phim' })
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'https://example.com/poster.jpg', description: 'URL hình ảnh poster' })
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=...', description: 'URL trailer' })
  trailer?: string;

  @IsOptional()
  @IsEnum(MovieType, { message: 'Loại phim phải là 2D hoặc 3D' })
  @ApiPropertyOptional({ example: MovieType.TwoD, enum: MovieType, description: 'Loại phim (2D hoặc 3D)' })
  type?: MovieType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional({ example: 120, description: 'Thời lượng phim (phút)' })
  duration?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày phát hành phải là định dạng ngày giờ hợp lệ (ISO 8601)' })
  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z', description: 'Ngày phát hành phim' })
  releaseDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu công chiếu phải là định dạng ngày giờ hợp lệ (ISO 8601)' })
  @ApiPropertyOptional({ example: '2025-01-15T00:00:00.000Z', description: 'Ngày bắt đầu công chiếu' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc công chiếu phải là định dạng ngày giờ hợp lệ (ISO 8601)' })
  @ApiPropertyOptional({ example: '2025-02-15T00:00:00.000Z', description: 'Ngày kết thúc công chiếu' })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    example: 'PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 13 TUỔI TRỞ LÊN (13+)', 
    description: 'Cảnh báo yêu cầu của phim' 
  })
  ratingWarning?: string;
}

