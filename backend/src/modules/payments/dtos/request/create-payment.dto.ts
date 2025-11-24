import { IsNotEmpty, IsInt, IsEnum, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../../common/constrants/enums';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'ID vé đặt' })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Booking ID phải là số nguyên dương' })
  bookingId: number;

  @ApiProperty({ 
    example: PaymentMethod.VNPAY, 
    description: 'Phương thức thanh toán',
    enum: PaymentMethod
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  method: PaymentMethod;

  @ApiProperty({ example: 200000, description: 'Số tiền thanh toán (VND)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Số tiền phải >= 0' })
  amount: number;

  @ApiProperty({ example: 1, description: 'ID mã khuyến mãi (nếu có)', required: false })
  @IsOptional()
  @IsInt()
  promotionId?: number;
}

