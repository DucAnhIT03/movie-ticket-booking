import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  firstName!: string | null;

  @ApiProperty({ nullable: true })
  lastName!: string | null;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ nullable: true })
  avatar!: string | null;

  @ApiProperty({ nullable: true })
  address!: string | null;

  @ApiProperty({ type: [String], nullable: true })
  roles!: string[] | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ nullable: true })
  updatedAt!: Date | null;

  @ApiProperty({ enum: ['ACTIVE', 'BLOCKED'], example: 'ACTIVE' })
  status!: string;

  static fromEntity(e: any): UserResponseDto {
    return {
      id: e.id,
      email: e.email,
      firstName: e.firstName,
      lastName: e.lastName,
      phone: e.phone,
      avatar: e.avatar,
      address: e.address,
      roles: e.roles || null,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      status: e.status || 'ACTIVE',
    } as UserResponseDto;
  }
}

