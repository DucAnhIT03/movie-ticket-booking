import { IsOptional, IsEnum } from 'class-validator';

export class FilterBookingDto {
  @IsOptional()
  @IsEnum(['ACTIVE', 'CANCELLED'])
  status?: 'ACTIVE' | 'CANCELLED';
}
