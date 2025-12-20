import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionDiscountType } from '../../../../shared/schemas/promotion.entity';

export class UpdatePromotionDto {
  @ApiPropertyOptional({ example: 'SUMMER2025' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Summer discount for festival' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Get 10% off on tickets' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/promo-image.jpg', description: 'URL ảnh khuyến mãi' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: PromotionDiscountType.PERCENT })
  @IsOptional()
  @IsEnum(PromotionDiscountType)
  discountType?: PromotionDiscountType;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ example: '2025-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  channelEmail?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  channelInApp?: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  perUserLimit?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    example: true,
    description:
      'Nếu bật: mã khuyến mãi sẽ được gợi ý ở màn thanh toán cho user nhập',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
