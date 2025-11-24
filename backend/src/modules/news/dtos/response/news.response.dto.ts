import { ApiProperty } from '@nestjs/swagger';

export class NewsResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  content?: string;

  @ApiProperty({ nullable: true })
  image?: string;

  @ApiProperty({ nullable: true })
  festivalId?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ nullable: true })
  updatedAt?: Date;

  static fromEntity(entity: any): NewsResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      content: entity.content,
      image: entity.image,
      festivalId: entity.festivalId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as NewsResponseDto;
  }
}

