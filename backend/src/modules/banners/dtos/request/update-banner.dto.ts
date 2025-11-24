import { IsEnum, IsOptional, IsString, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BannerType } from '../../../../common/constants/enums';

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  url?: string;

  @IsOptional()
  @IsEnum(BannerType)
  type?: BannerType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  height?: number;
}
