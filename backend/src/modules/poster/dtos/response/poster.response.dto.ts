import { ApiProperty } from '@nestjs/swagger';
import type { PosterEntity } from '../../../../shared/types/poster';

export class PosterResponseDto {
  @ApiProperty()
  id!: number;
  @ApiProperty({ nullable: true })
  image_url!: string | null;
  @ApiProperty()
  created_at!: Date;
  @ApiProperty({ nullable: true })
  updated_at!: Date | null;

  static fromEntity(e: PosterEntity): PosterResponseDto {
    return {
      id: e.id,
      image_url: e.image_url,
      created_at: e.created_at,
      updated_at: e.updated_at,
    } as PosterResponseDto;
  }
}












