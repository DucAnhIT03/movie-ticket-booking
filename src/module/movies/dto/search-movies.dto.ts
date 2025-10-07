import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';

export class SearchMoviesDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsIn(['NOW_SHOWING','UPCOMING']) status?: 'NOW_SHOWING'|'UPCOMING';
  @IsOptional() @IsString() genre?: string;
  @IsOptional() @IsNumberString() page?: string;
  @IsOptional() @IsNumberString() limit?: string;
}
