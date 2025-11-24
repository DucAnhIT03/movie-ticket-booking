import { IsInt, IsOptional, MaxLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdateNewsDto {
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  content?: string;

  @IsOptional()
  @MaxLength(500)
  image?: string;

  @IsOptional()
  @IsInt()
  @Expose({ name: 'festival_id' })
  festivalId?: number;
}
