import { ApiProperty } from '@nestjs/swagger';

export class VnpayWebhookResponseDto {
  @ApiProperty({
    example: '00',
    description: 'Mã phản hồi: 00 = Success, 97 = Checksum failed, 01 = Order not found, 04 = Invalid amount, 99 = Unknown error'
  })
  RspCode!: string;

  @ApiProperty({
    example: 'Success',
    description: 'Thông báo kết quả'
  })
  Message!: string;
}







