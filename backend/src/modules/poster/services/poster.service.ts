import { Injectable } from '@nestjs/common';
import { PosterRepository } from '../repositories/poster.repository';
import { UpdatePosterDto } from '../dtos/request/update-poster.dto';
import type { PosterEntity } from '../../../shared/types/poster';

@Injectable()
export class PosterService {
  constructor(private readonly repo: PosterRepository) {}

  async findOne(): Promise<PosterEntity | null> {
    return this.repo.findOne();
  }

  async update(dto: UpdatePosterDto): Promise<PosterEntity> {
    return this.repo.createOrUpdate({
      image_url: dto.image_url ?? null,
    });
  }
}












