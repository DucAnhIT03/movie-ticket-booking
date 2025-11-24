import { ApiProperty } from '@nestjs/swagger';

export class TicketPriceResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  typeSeat!: string;

  @ApiProperty()
  typeMovie!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  dayType!: boolean;

  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;

  @ApiProperty({ required: false, nullable: true })
  startDate?: Date | string | null;

  @ApiProperty({ required: false, nullable: true })
  endDate?: Date | string | null;

  @ApiProperty({ required: false, nullable: true })
  movieId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  theaterId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  created_at?: Date | string;

  @ApiProperty({ required: false, nullable: true })
  updated_at?: Date | string;

  static fromEntity(entity: any): TicketPriceResponseDto {
    return {
      id: entity.id,
      typeSeat: entity.typeSeat,
      typeMovie: entity.typeMovie,
      price: entity.price,
      dayType: entity.dayType,
      startTime: entity.startTime,
      endTime: entity.endTime,
      startDate: entity.startDate || null,
      endDate: entity.endDate || null,
      movieId: entity.movieId || null,
      theaterId: entity.theaterId || null,
      created_at: entity.created_at || null,
      updated_at: entity.updated_at || null,
    } as TicketPriceResponseDto;
  }
}

