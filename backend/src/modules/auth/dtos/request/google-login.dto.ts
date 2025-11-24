import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google ID token từ frontend',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}









