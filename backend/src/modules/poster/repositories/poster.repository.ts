import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poster } from '../../../shared/schemas/poster.entity';
import type { PosterEntity } from '../../../shared/types/poster';

@Injectable()
export class PosterRepository {
  constructor(@InjectRepository(Poster) private readonly repo: Repository<Poster>) {}

  async findOne(): Promise<PosterEntity | null> {
    const row = await this.repo.findOne({ 
      where: {},
      order: { id: 'DESC' } 
    });
    return (row as unknown as PosterEntity) ?? null;
  }

  async createOrUpdate(data: { image_url: string | null }): Promise<PosterEntity> {
    const existing = await this.findOne();
    if (existing) {
      await this.repo.update({ id: existing.id }, { 
        image_url: data.image_url,
        updated_at: new Date(),
      } as any);
      const updated = await this.repo.findOne({ where: { id: existing.id } });
      return updated as unknown as PosterEntity;
    } else {
      const created = await this.repo.save(this.repo.create({
        image_url: data.image_url,
      } as any));
      return created as unknown as PosterEntity;
    }
  }
}

