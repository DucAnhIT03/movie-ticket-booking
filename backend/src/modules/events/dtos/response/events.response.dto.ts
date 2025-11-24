import type { EventEntity } from '../../../../shared/types/event';
import { ApiProperty } from '@nestjs/swagger';

export class EventResponseDto {
  @ApiProperty()
  id!: number;
  
  @ApiProperty()
  title!: string;
  
  @ApiProperty({ nullable: true })
  description!: string | null;
  
  @ApiProperty({ nullable: true })
  image!: string | null;
  
  @ApiProperty({ nullable: true })
  location!: string | null;
  
  @ApiProperty()
  start_time!: Date;
  
  @ApiProperty()
  end_time!: Date;
  
  @ApiProperty({ enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] })
  status!: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  
  @ApiProperty()
  created_at!: Date;
  
  @ApiProperty({ nullable: true })
  updated_at!: Date | null;

  static fromEntity(e: EventEntity): EventResponseDto {
    return { ...e } as EventResponseDto;
  }
}


