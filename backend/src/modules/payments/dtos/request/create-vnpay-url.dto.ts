import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVnpayUrlDto {
  @ApiProperty({ 
    example: 'http://localhost:3000/api/payments/vnpay/return', 
    description: 'URL trả về sau khi thanh toán thành công' 
  })
  @IsNotEmpty()
  @IsString()
  @Matches(
    /^https?:\/\/.+/,
    {
      message: 'returnUrl must be a valid URL starting with http:// or https://',
    }
  )
  returnUrl: string;
}

