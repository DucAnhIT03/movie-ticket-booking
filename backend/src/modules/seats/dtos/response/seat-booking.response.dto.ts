import { ApiProperty } from '@nestjs/swagger';

export class SeatBookingResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  screenId!: number;

  @ApiProperty()
  seatNumber!: string;

  @ApiProperty()
  isVariable!: boolean;

  @ApiProperty()
  isHidden!: boolean;

  @ApiProperty()
  type!: string;

  @ApiProperty({ description: 'Ghế đã được đặt trong suất chiếu này' })
  isBooked!: boolean;

  @ApiProperty({ nullable: true })
  createdAt?: Date;

  @ApiProperty({ nullable: true })
  updatedAt?: Date;

  static fromEntity(entity: any, isBooked: boolean = false): SeatBookingResponseDto {
    return {
      id: entity.id,
      screenId: entity.screenId,
      seatNumber: entity.seatNumber,
      isVariable: entity.isVariable,
      isHidden: entity.isHidden || false,
      type: entity.type || 'STANDARD', // Đảm bảo luôn có type, mặc định STANDARD
      isBooked: isBooked,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as SeatBookingResponseDto;
  }
}

