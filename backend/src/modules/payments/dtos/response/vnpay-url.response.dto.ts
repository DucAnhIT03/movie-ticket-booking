import { ApiProperty } from '@nestjs/swagger';

export class VnpayUrlResponseDto {
  @ApiProperty({
    example: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1000000&vnp_Command=pay&...',
    description: 'URL thanh toán VNPAY để redirect người dùng'
  })
  paymentUrl!: string;

  @ApiProperty({
    example: 1,
    description: 'ID của payment'
  })
  paymentId!: number;
}








