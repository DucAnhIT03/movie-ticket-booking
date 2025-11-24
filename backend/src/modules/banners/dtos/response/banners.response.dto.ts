import { ApiProperty } from '@nestjs/swagger';

export class BannerResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  position!: string;

  @ApiProperty({ required: false, nullable: true })
  width?: number | null;

  @ApiProperty({ required: false, nullable: true })
  height?: number | null;

  @ApiProperty({ nullable: true })
  created_at?: Date;

  static fromEntity(entity: any): BannerResponseDto {
    return {
      id: entity.id,
      url: entity.url,
      type: entity.type,
      position: entity.position,
      width: entity.width ?? null,
      height: entity.height ?? null,
      created_at: entity.created_at,
    } as BannerResponseDto;
  }
}

