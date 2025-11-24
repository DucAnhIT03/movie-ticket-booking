import { IsNumber } from 'class-validator';

export class CancelBookingDto {
  @IsNumber()
  bookingId: number;
}

