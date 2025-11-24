import { ApiProperty } from '@nestjs/swagger';

export class SeatResponseDto {
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

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ nullable: true })
  updatedAt?: Date;

  static fromEntity(entity: any): SeatResponseDto {
    return {
      id: entity.id,
      screenId: entity.screenId,
      seatNumber: entity.seatNumber,
      isVariable: entity.isVariable,
      isHidden: entity.isHidden || false,
      type: entity.type || 'STANDARD', // Đảm bảo luôn có type, mặc định STANDARD
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as SeatResponseDto;
  }
}

