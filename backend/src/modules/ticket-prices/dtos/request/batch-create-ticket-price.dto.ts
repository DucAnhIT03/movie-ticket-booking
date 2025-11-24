import { IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTicketPriceDto } from './create-ticket-price.dto';

export class BatchCreateTicketPriceDto {
  @ApiProperty({ 
    description: 'Danh sách giá vé cần tạo',
    type: [CreateTicketPriceDto]
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketPriceDto)
  ticketPrices: CreateTicketPriceDto[];
}

