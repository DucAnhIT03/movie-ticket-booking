import type { EmailLogEntity } from '../../../../shared/types/email-log';
import { ApiProperty } from '@nestjs/swagger';

export class EmailLogResponseDto {
  @ApiProperty()
  id!: number;
  
  @ApiProperty()
  to!: string;
  
  @ApiProperty()
  subject!: string;
  
  @ApiProperty({ nullable: true })
  type!: string | null;
  
  @ApiProperty({ enum: ['PENDING', 'SENT', 'FAILED'] })
  status!: 'PENDING' | 'SENT' | 'FAILED';
  
  @ApiProperty({ nullable: true })
  error!: string | null;
  
  @ApiProperty({ nullable: true })
  messageId!: string | null;
  
  @ApiProperty()
  sentAt!: Date;
  
  @ApiProperty({ nullable: true, type: Object, required: false })
  metadata!: Record<string, any> | null;

  static fromEntity(e: EmailLogEntity): EmailLogResponseDto {
    return { ...e } as EmailLogResponseDto;
  }
}

