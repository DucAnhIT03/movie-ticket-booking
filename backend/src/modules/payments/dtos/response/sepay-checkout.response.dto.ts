import { ApiProperty } from '@nestjs/swagger';

export class SepayCheckoutResponseDto {
  @ApiProperty({
    description: 'Endpoint URL của SePay để submit form thanh toán',
    example: 'https://pay-sandbox.sepay.vn/v1/checkout/init',
  })
  checkoutUrl!: string;

  @ApiProperty({
    description: 'Danh sách field cần submit tới SePay',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  fields!: Record<string, string | number>;

  @ApiProperty({ description: 'ID của payment trong hệ thống', example: 123 })
  paymentId!: number;

  constructor(partial: Partial<SepayCheckoutResponseDto>) {
    Object.assign(this, partial);
  }
}


