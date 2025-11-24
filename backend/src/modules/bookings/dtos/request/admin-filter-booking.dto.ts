import { IsOptional, IsEnum, IsNumberString, IsString } from 'class-validator';
import { BookingStatus } from '../../../../common/constrants/enums';

export class AdminFilterBookingDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus; 

  @IsOptional()
  @IsNumberString()
  page?: string; 

  @IsOptional()
  @IsNumberString()
  limit?: string; 
}

