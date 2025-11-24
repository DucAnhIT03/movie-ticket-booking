import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  payment_method!: string;

  @ApiProperty()
  payment_status!: string;

  @ApiProperty({ nullable: true })
  payment_time?: Date;

  @ApiProperty()
  amount!: number;

  @ApiProperty({ nullable: true })
  transaction_id?: string;

  static fromEntity(entity: any): PaymentResponseDto {
    return {
      id: entity.id,
      payment_method: entity.payment_method,
      payment_status: entity.payment_status,
      payment_time: entity.payment_time,
      amount: entity.amount,
      transaction_id: entity.transaction_id,
    } as PaymentResponseDto;
  }
}

