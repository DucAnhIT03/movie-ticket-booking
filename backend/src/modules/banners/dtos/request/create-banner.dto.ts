import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BannerType, Position } from '../../../../common/constants/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBannerDto {
  @ApiProperty({ example: 'https://example.com/banner.jpg' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  url: string;

  @ApiProperty({ example: BannerType.IMAGE })
  @IsNotEmpty()
  @IsEnum(BannerType)
  type: BannerType;

  @ApiProperty({ example: Position.Header })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  position: string;

  @ApiProperty({
    example: 1440,
    required: false,
    description: 'Chiều ngang banner (px)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  width?: number;

  @ApiProperty({
    example: 480,
    required: false,
    description: 'Chiều dọc banner (px)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  height?: number;
}
