import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BannerPoster } from '../../../shared/schemas/banner-poster.entity';
import type { BannerPosterEntity } from '../../../shared/types/banner-poster';

@Injectable()
export class BannerPosterRepository {
  constructor(@InjectRepository(BannerPoster) private readonly repo: Repository<BannerPoster>) {}

  async findOne(): Promise<BannerPosterEntity | null> {
    const row = await this.repo.findOne({ 
      where: {},
      order: { id: 'DESC' } 
    });
    return (row as unknown as BannerPosterEntity) ?? null;
  }

  async createOrUpdate(data: { image_url: string | null }): Promise<BannerPosterEntity> {
    const existing = await this.findOne();
    if (existing) {
      await this.repo.update({ id: existing.id }, { 
        image_url: data.image_url,
        updated_at: new Date(),
      } as any);
      const updated = await this.repo.findOne({ where: { id: existing.id } });
      return updated as unknown as BannerPosterEntity;
    } else {
      const created = await this.repo.save(this.repo.create({
        image_url: data.image_url,
      } as any));
      return created as unknown as BannerPosterEntity;
    }
  }
}

