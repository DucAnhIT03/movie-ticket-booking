import type { ScreenEntity } from '../../../../shared/types/screen';
import { ApiProperty } from '@nestjs/swagger';

export class ScreenResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() seat_capacity!: number;
  @ApiProperty() theater_id!: number;
  @ApiProperty() created_at!: Date;
  @ApiProperty({ nullable: true }) updated_at!: Date | null;

  static fromEntity(e: ScreenEntity): ScreenResponseDto {
    return { ...e } as ScreenResponseDto;
  }
}



