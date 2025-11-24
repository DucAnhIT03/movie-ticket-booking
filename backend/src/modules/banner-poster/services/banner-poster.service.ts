import { Injectable } from '@nestjs/common';
import { BannerPosterRepository } from '../repositories/banner-poster.repository';
import { UpdateBannerPosterDto } from '../dtos/request/update-banner-poster.dto';
import type { BannerPosterEntity } from '../../../shared/types/banner-poster';

@Injectable()
export class BannerPosterService {
  constructor(private readonly repo: BannerPosterRepository) {}

  async findOne(): Promise<BannerPosterEntity | null> {
    return this.repo.findOne();
  }

  async update(dto: UpdateBannerPosterDto): Promise<BannerPosterEntity> {
    return this.repo.createOrUpdate({
      image_url: dto.image_url ?? null,
    });
  }
}

