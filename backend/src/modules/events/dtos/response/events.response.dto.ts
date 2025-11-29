import type { EventEntity } from '../../../../shared/types/event';
import { ApiProperty } from '@nestjs/swagger';

export class EventResponseDto {
  @ApiProperty()
  id!: number;
  
  @ApiProperty()
  title!: string;
  
  @ApiProperty({ nullable: true })
  description!: string | null;
  
  @ApiProperty({ nullable: true, description: 'Bài viết chi tiết sự kiện' })
  content!: string | null;

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

  @ApiProperty({ description: 'Có phải sự kiện đặc biệt hay không', default: false })
  is_special!: boolean;

  @ApiProperty({ description: 'Số lượt đăng ký tham dự', default: 0 })
  registrations_count?: number;
  
  @ApiProperty()
  created_at!: Date;
  
  @ApiProperty({ nullable: true })
  updated_at!: Date | null;

  static fromEntity(e: EventEntity): EventResponseDto {
    return { ...e } as EventResponseDto;
  }
}


