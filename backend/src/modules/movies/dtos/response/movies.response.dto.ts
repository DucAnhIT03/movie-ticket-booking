import type { MovieEntity } from '../../../../shared/types/movie';
import { ApiProperty } from '@nestjs/swagger';

export class MovieResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) descriptions!: string | null;
  @ApiProperty({ nullable: true }) author!: string | null;
  @ApiProperty({ nullable: true }) image!: string | null;
  @ApiProperty({ nullable: true }) trailer!: string | null;
  @ApiProperty({ enum: ['2D', '3D'] }) type!: '2D' | '3D';
  @ApiProperty() duration!: number;
  @ApiProperty() release_date!: Date;
  @ApiProperty() created_at!: Date;
  @ApiProperty({ nullable: true }) updated_at!: Date | null;
  @ApiProperty({ type: [String], required: false }) genres?: string[];

  static fromEntity(e: any): MovieResponseDto {
    return { ...e } as MovieResponseDto;
  }

  static fromEntities(entities: any[]): MovieResponseDto[] {
    return entities.map(e => this.fromEntity(e));
  }
}

