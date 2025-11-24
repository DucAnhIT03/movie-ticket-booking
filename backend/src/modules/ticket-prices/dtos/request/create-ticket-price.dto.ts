import { IsNotEmpty, IsEnum, IsNumber, IsString, Min, IsBoolean, Matches, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SeatTypeEnum, MovieTypeEnum } from '../../../../common/constrants/enums';

export class CreateTicketPriceDto {
  @ApiProperty({ 
    example: SeatTypeEnum.STANDARD, 
    description: 'Loại ghế',
    enum: SeatTypeEnum
  })
  @IsNotEmpty()
  @IsEnum(SeatTypeEnum, { message: 'Loại ghế phải là STANDARD, VIP hoặc SWEETBOX' })
  typeSeat: SeatTypeEnum;

  @ApiPropertyOptional({ 
    example: MovieTypeEnum['2D'], 
    description: 'Loại phim (bắt buộc nếu không chọn movieId)',
    enum: MovieTypeEnum
  })
  @ValidateIf((o) => !o.movieId)
  @IsNotEmpty({ message: 'Vui lòng chọn loại phim (2D hoặc 3D) nếu không chọn phim cụ thể' })
  @IsEnum(MovieTypeEnum, { message: 'Loại phim phải là 2D hoặc 3D' })
  typeMovie?: MovieTypeEnum;

  @ApiPropertyOptional({ example: 1, description: 'ID phim (ưu tiên hơn typeMovie)' })
  @IsOptional()
  @IsNumber()
  movieId?: number | null;

  @ApiProperty({ example: 150000, description: 'Giá vé (VND)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Giá vé phải >= 0' })
  price: number;

  @ApiProperty({ example: false, description: 'Loại ngày: false = ngày thường, true = cuối tuần' })
  @IsNotEmpty()
  @IsBoolean()
  dayType: boolean;

  @ApiProperty({ example: '08:00', description: 'Giờ bắt đầu (HH:MM)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Định dạng giờ phải là HH:MM (24h)' })
  startTime: string;

  @ApiProperty({ example: '23:59', description: 'Giờ kết thúc (HH:MM)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Định dạng giờ phải là HH:MM (24h)' })
  endTime: string;

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

