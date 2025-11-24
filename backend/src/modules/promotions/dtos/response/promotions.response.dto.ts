import { ApiProperty } from '@nestjs/swagger';

export class PromotionResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  description?: string;

  @ApiProperty()
  discountType!: string;

  @ApiProperty()
  discountValue!: number;

  @ApiProperty()
  channelEmail!: boolean;

  @ApiProperty()
  channelInApp!: boolean;

  @ApiProperty({ nullable: true })
  startAt?: Date;

  @ApiProperty({ nullable: true })
  endAt?: Date;

  @ApiProperty({ nullable: true })
  usageLimit?: number;

  @ApiProperty({ nullable: true })
  perUserLimit?: number;

  @ApiProperty()
  active!: boolean;

  static fromEntity(entity: any): PromotionResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      title: entity.title,
      description: entity.description,
      discountType: entity.discountType,
      discountValue: entity.discountValue,
      channelEmail: entity.channelEmail,
      channelInApp: entity.channelInApp,
      startAt: entity.startAt,
      endAt: entity.endAt,
      usageLimit: entity.usageLimit,
      perUserLimit: entity.perUserLimit,
      active: entity.active,
    } as PromotionResponseDto;
  }
}

