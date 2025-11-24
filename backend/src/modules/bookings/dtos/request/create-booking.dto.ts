import { IsInt, IsArray, ArrayMinSize, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 5, description: 'ID suất chiếu' })
  @IsNotEmpty()
  @IsInt()
  showtimeId: number;

  @ApiProperty({ example: [10, 11], description: 'Danh sách ID ghế', type: [Number] })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 ghế' })
  @IsInt({ each: true })
  seatIds: number[];

  @ApiProperty({ example: 300000, description: 'Tổng giá vé' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Tổng giá vé phải >= 0' })
  totalPriceMovie: number; 
}

