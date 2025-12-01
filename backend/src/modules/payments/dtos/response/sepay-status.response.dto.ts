import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from 'src/common/constrants/enums';

export class SepayStatusResponseDto {
  @ApiProperty({
    enum: PaymentStatus,
    description: 'Trạng thái thanh toán trong hệ thống',
  })
  paymentStatus!: PaymentStatus;

  @ApiProperty({
    required: false,
    description: 'Trạng thái đơn hàng trả về từ SePay',
    example: 'SUCCESS',
  })
  orderStatus?: string;

  @ApiProperty({
    required: false,
    description: 'Thông tin bổ sung khi giao dịch chưa thành công',
  })
  failureReason?: string;

  constructor(partial: Partial<SepayStatusResponseDto>) {
    Object.assign(this, partial);
  }
}


