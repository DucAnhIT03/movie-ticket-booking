import { IsInt, IsArray, ArrayNotEmpty, IsNumber } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  userId: number;

  @IsInt()
  showtimeId: number;

  @IsArray()
  @ArrayNotEmpty()
  seatIds: number[];

  @IsNumber()
  totalPrice: number;
}
