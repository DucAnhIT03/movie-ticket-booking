import { IsOptional, IsEnum, IsNumberString, IsString } from 'class-validator';
import { BookingStatus } from '../../../../common/constrants/enums';
import { BookingChannel } from '../../../../common/constants/enums';

export class AdminFilterBookingDto {
  @IsOptional()
  @IsString()
  q?: string;

  /**
   * Lọc từ ngày tạo (YYYY-MM-DD hoặc ISO date string)
   */
  @IsOptional()
  @IsString()
  startDate?: string;

  /**
   * Lọc đến ngày tạo (YYYY-MM-DD hoặc ISO date string)
   */
  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus; 

  @IsOptional()
  @IsNumberString()
  page?: string; 

  @IsOptional()
  @IsNumberString()
  limit?: string; 

  @IsOptional()
  @IsEnum(BookingChannel)
  channel?: BookingChannel;
}

