import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGenreDto {
  @ApiProperty({ example: 'Action' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  genreName: string;
}

