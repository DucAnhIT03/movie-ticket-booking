import type { TheaterEntity } from '../../../../shared/types/theater';
import { ApiProperty } from '@nestjs/swagger';

export class TheaterResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() location!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() created_at!: Date;
  @ApiProperty({ nullable: true }) updated_at!: Date | null;

  static fromEntity(e: TheaterEntity): TheaterResponseDto {
    return { ...e, updated_at: e.updated_at ?? null } as TheaterResponseDto;
  }
}



