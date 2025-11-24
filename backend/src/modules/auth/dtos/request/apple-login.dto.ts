import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppleLoginDto {
  @ApiProperty({
    description: 'Apple identity token (JWT) từ frontend',
    example: 'eyJraWQiOiJlWGF1bm1IMiIsImFsZyI6IlJTMjU2In0...',
  })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiProperty({
    description: 'Apple user identifier',
    example: '001234.567890abcdef.1234',
    required: false,
  })
  @IsString()
  @IsOptional()
  user?: string;

  @ApiProperty({
    description: 'Email từ Apple (có thể không có nếu user ẩn email)',
    example: 'user@example.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Tên đầy đủ từ Apple (chỉ có lần đầu)',
    example: 'Nguyen Van A',
    required: false,
  })
  @IsString()
  @IsOptional()
  fullName?: string;
}









