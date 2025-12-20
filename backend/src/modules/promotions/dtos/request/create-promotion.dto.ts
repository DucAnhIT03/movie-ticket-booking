
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionDiscountType } from '../../../../shared/schemas/promotion.entity';

export class CreatePromotionDto {
  @ApiProperty({ example: 'SUMMER2025' })
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 'Summer discount for festival' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Get 10% off on tickets' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/promo-image.jpg', description: 'URL ảnh khuyến mãi' })
  @IsOptional()
  image?: string;

  @ApiProperty({ example: PromotionDiscountType.PERCENT })
  @IsEnum(PromotionDiscountType)
  discountType: PromotionDiscountType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  discountValue: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  channelEmail?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  channelInApp?: boolean;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ example: '2025-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  perUserLimit?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Nếu bật: mã khuyến mãi sẽ được gợi ý ở màn thanh toán cho user nhập',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
