import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateMomoUrlDto {
  @ApiProperty({
    description: 'URL để MoMo redirect người dùng sau khi thanh toán',
    example: 'https://your-frontend.com/payment-success',
  })
  @IsString()
  returnUrl: string;

  @ApiProperty({
    description: 'IPN URL để MoMo gọi về khi thanh toán hoàn tất',
    example: 'https://your-backend.com/payments/momo/ipn',
  })
  @IsOptional()
  @IsString()
  ipnUrl?: string;

  @ApiProperty({
    description: 'Thông tin đơn hàng hiển thị trên MoMo',
    example: 'Thanh toán vé xem phim',
    required: false,
  })
  @IsOptional()
  @IsString()
  orderInfo?: string;
}


