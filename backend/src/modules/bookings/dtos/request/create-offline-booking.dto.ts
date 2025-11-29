import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../../../common/constrants/enums';

export class CreateOfflineBookingDto {
  @ApiProperty({ example: 5, description: 'ID suất chiếu cần xuất vé' })
  @IsInt()
  @IsPositive()
  showtimeId: number;

  @ApiProperty({
    type: [Number],
    description: 'Danh sách ID ghế cần giữ',
    example: [101, 102],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  seatIds: number[];

  @ApiPropertyOptional({
    example: 300000,
    description: 'Tổng tiền vé sau khi áp dụng ưu đãi (nếu có). Nếu bỏ trống hệ thống sẽ tự tính.',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalPriceMovie?: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Phương thức thanh toán tại quầy',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    example: 'Nguyễn Văn B',
    description: 'Tên khách mua vé tại quầy',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customerName: string;

  @ApiPropertyOptional({
    example: '0912345678',
    description: 'Số điện thoại khách mua vé (tuỳ chọn)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @ApiPropertyOptional({
    example: 123,
    description: 'ID người dùng trên hệ thống nếu khách đã có tài khoản',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  existingUserId?: number;
}

