import { IsOptional, IsEnum, IsNumber, IsString, Min, IsBoolean, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SeatTypeEnum, MovieTypeEnum } from '../../../../common/constrants/enums';

export class UpdateTicketPriceDto {
  @ApiPropertyOptional({ 
    example: SeatTypeEnum.STANDARD, 
    description: 'Loại ghế',
    enum: SeatTypeEnum
  })
  @IsOptional()
  @IsEnum(SeatTypeEnum, { message: 'Loại ghế phải là STANDARD, VIP hoặc SWEETBOX' })
  typeSeat?: SeatTypeEnum;

  @ApiPropertyOptional({ 
    example: MovieTypeEnum['2D'], 
    description: 'Loại phim (deprecated - dùng movieId thay thế)',
    enum: MovieTypeEnum
  })
  @IsOptional()
  @IsEnum(MovieTypeEnum, { message: 'Loại phim phải là 2D hoặc 3D' })
  typeMovie?: MovieTypeEnum;

  @ApiPropertyOptional({ example: 1, description: 'ID phim' })
  @IsOptional()
  @IsNumber()
  movieId?: number | null;

  @ApiPropertyOptional({ example: 150000, description: 'Giá vé (VND)' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Giá vé phải >= 0' })
  price?: number;

  @ApiPropertyOptional({ example: false, description: 'Loại ngày: false = ngày thường, true = cuối tuần' })
  @IsOptional()
  @IsBoolean()
  dayType?: boolean;

  @ApiPropertyOptional({ example: '08:00', description: 'Giờ bắt đầu (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Định dạng giờ phải là HH:MM (24h)' })
  startTime?: string;

  @ApiPropertyOptional({ example: '23:59', description: 'Giờ kết thúc (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Định dạng giờ phải là HH:MM (24h)' })
  endTime?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID rạp chiếu phim (null = áp dụng cho tất cả rạp)' })
  @IsOptional()
  @IsNumber()
  theaterId?: number | null;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Ngày bắt đầu áp dụng (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string | null;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Ngày kết thúc áp dụng (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string | null;
}

