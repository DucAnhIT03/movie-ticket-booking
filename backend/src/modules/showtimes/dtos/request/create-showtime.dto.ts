import { IsInt, IsDateString, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShowtimeDto {
  @ApiProperty({ example: 5, description: 'ID phim' })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Movie ID phải là số nguyên dương' })
  movieId: number;

  @ApiProperty({ example: 2, description: 'ID phòng chiếu' })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Screen ID phải là số nguyên dương' })
  screenId: number;

  @ApiProperty({ example: '2025-01-20T18:00:00.000Z', description: 'Thời gian bắt đầu (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString({}, { message: 'Thời gian bắt đầu phải là định dạng ngày giờ hợp lệ (ISO 8601)' })
  startTime: string;

  @ApiProperty({ example: '2025-01-20T20:30:00.000Z', description: 'Thời gian kết thúc (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString({}, { message: 'Thời gian kết thúc phải là định dạng ngày giờ hợp lệ (ISO 8601)' })
  endTime: string;
}

