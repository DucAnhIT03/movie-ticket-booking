import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, IsPositive } from 'class-validator';

export class OfflineBookingQuoteDto {
  @ApiProperty({ example: 5, description: 'ID suất chiếu cần tính giá' })
  @IsInt()
  @IsPositive()
  showtimeId: number;

  @ApiProperty({
    type: [Number],
    description: 'Danh sách ghế cần tính giá',
    example: [101, 102],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  seatIds: number[];
}



