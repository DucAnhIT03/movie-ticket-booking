import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGenreDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  genreName?: string;
}

