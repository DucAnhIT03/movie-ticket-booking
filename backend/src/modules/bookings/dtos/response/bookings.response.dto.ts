import { ApiProperty } from '@nestjs/swagger';
import { BookingChannel } from '../../../../common/constants/enums';

export class BookingResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  showtimeId!: number;

  @ApiProperty()
  totalSeat!: number;

  @ApiProperty()
  totalPriceMovie!: number;

  @ApiProperty({ enum: BookingChannel })
  channel!: BookingChannel;

  @ApiProperty({ nullable: true })
  customerName?: string;

  @ApiProperty({ nullable: true })
  customerPhone?: string;

  @ApiProperty({ nullable: true })
  createdByStaffId?: number | null;

  @ApiProperty({ nullable: true })
  invoiceCode?: string | null;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty({ nullable: true })
  updated_at?: Date;

  static fromEntity(entity: any): BookingResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      showtimeId: entity.showtimeId,
      totalSeat: entity.totalSeat,
      totalPriceMovie: entity.totalPriceMovie,
      channel: entity.channel,
      customerName: entity.customerName,
      customerPhone: entity.customerPhone,
      createdByStaffId: entity.createdByStaffId ?? entity.createdByStaff?.id ?? null,
      invoiceCode: entity.invoiceCode ?? null,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    } as BookingResponseDto;
  }
}

