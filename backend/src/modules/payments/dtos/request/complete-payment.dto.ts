import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompletePaymentDto {
  @ApiProperty({ example: 'txn_123456789', description: 'ID giao dịch từ cổng thanh toán' })
  @IsNotEmpty()
  @IsString()
  transactionId: string;

  @ApiPropertyOptional({ example: true, description: 'Thanh toán thành công hay không', default: true })
  @IsOptional()
  @IsBoolean()
  success?: boolean;
}

