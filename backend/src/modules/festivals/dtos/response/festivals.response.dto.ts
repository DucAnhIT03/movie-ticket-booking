import type { FestivalEntity } from '../../../../shared/types/festival';
import { ApiProperty } from '@nestjs/swagger';

export class FestivalResponseDto {
  @ApiProperty()
  id!: number;
  @ApiProperty()
  title!: string;
  @ApiProperty({ nullable: true })
  image!: string | null;
  @ApiProperty({ nullable: true })
  content!: string | null;
  @ApiProperty()
  start_time!: Date;
  @ApiProperty()
  end_time!: Date;

  static fromEntity(e: FestivalEntity): FestivalResponseDto {
    return {
      id: e.id,
      title: e.title,
      image: e.image,
      content: e.content,
      start_time: e.start_time,
      end_time: e.end_time,
    } as FestivalResponseDto;
  }
}


