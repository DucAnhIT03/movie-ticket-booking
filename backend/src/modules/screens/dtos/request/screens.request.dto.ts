import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScreenRequestDto {
  @ApiProperty({ example: 'Phòng chiếu 1', description: 'Tên phòng chiếu' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 120, minimum: 0, description: 'Sức chứa ghế' })
  @IsInt()
  @Min(0)
  seat_capacity!: number;

  @ApiProperty({ example: 1, minimum: 1, description: 'ID rạp chiếu liên kết' })
  @IsInt()
  @Min(1)
  theater_id!: number;
}

export class UpdateScreenRequestDto {
  @ApiPropertyOptional({ example: 'Phòng IMAX', description: 'Tên mới của phòng chiếu' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 150, minimum: 0, description: 'Sức chứa ghế mới' })
  @IsOptional()
  @IsInt()
  @Min(0)
  seat_capacity?: number;

  @ApiPropertyOptional({ example: 2, minimum: 1, description: 'ID rạp chiếu mới' })
  @IsOptional()
  @IsInt()
  @Min(1)
  theater_id?: number;
}


