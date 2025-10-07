import { IsString, IsBoolean, IsDateString, IsOptional, IsNumber } from 'class-validator';

export class CreateMovieDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  director: string;

  @IsString()
  cast: string;

  @IsString()
  genre: string;

  @IsDateString()
  releaseDate: string;

  @IsNumber()
  duration: number;

  @IsBoolean()
  isShowing: boolean;

  @IsOptional()
  @IsString()
  posterUrl?: string;
}
