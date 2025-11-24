import { ApiProperty } from '@nestjs/swagger';

export class BookingResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  showtimeId!: number;

  @ApiProperty()
  totalSeat!: number;

  @ApiProperty()
  totalPriceMovie!: number;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty({ nullable: true })
  updated_at?: Date;

  static fromEntity(entity: any): BookingResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      showtimeId: entity.showtimeId,
      totalSeat: entity.totalSeat,
      totalPriceMovie: entity.totalPriceMovie,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    } as BookingResponseDto;
  }
}

