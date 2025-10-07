import { IsInt, IsDateString, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateShowtimeDto {
  @IsInt()
  movieId: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  room: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
