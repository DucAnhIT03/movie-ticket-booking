import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyPromotionDto {
  @ApiProperty({ example: 'SUMMER2025' })
  @IsNotEmpty()
  code: string;
}
