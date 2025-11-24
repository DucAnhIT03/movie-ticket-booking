import { ApiProperty } from '@nestjs/swagger';

export class ShowtimeResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  screenId!: number;

  @ApiProperty()
  movieId!: number;

  @ApiProperty()
  startTime!: Date;

  @ApiProperty()
  endTime!: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ nullable: true })
  updatedAt?: Date;

  @ApiProperty({ nullable: true })
  screen?: any;

  @ApiProperty({ nullable: true })
  movie?: any;

  static fromEntity(entity: any): ShowtimeResponseDto {
    return {
      id: entity.id,
      screenId: entity.screenId,
      movieId: entity.movieId,
      startTime: entity.startTime,
      endTime: entity.endTime,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      screen: entity.screen, // Bao gồm screen với theater
      movie: entity.movie, // Bao gồm movie
    } as ShowtimeResponseDto;
  }
}

