import { ApiProperty } from '@nestjs/swagger';
import type { EventRegistrationEntity } from '../../../../shared/types/event-registration';

export class EventRegistrationResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  event_id!: number;

  @ApiProperty()
  full_name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty({ nullable: true })
  note!: string | null;

  @ApiProperty()
  created_at!: Date;

  static fromEntity(entity: EventRegistrationEntity): EventRegistrationResponseDto {
    return { ...entity };
  }
}




