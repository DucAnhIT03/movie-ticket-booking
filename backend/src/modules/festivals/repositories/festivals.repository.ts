import type { FestivalEntity } from '../../../shared/types/festival';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { FestivalOrmEntity } from '../../../shared/schemas/festival.orm-entity';

@Injectable()
export class FestivalsRepository {
  constructor(@InjectRepository(FestivalOrmEntity) private readonly repo: Repository<FestivalOrmEntity>) {}

  async findAndCount(params: { page: number; limit: number; search?: string }): Promise<{ items: FestivalEntity[]; total: number }>{
    const query = this.repo.createQueryBuilder('festival');
    
    if (params.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.where(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('festival.id = :searchId', { searchId })
              .orWhere('festival.title LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('festival.title LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }
    
    query.orderBy('festival.start_time', 'DESC');
    query.skip((params.page - 1) * params.limit).take(params.limit);
    
    const [rows, total] = await query.getManyAndCount();
    return { items: rows as unknown as FestivalEntity[], total };
  }

  async findById(id: number): Promise<FestivalEntity | null> {
    const row = await this.repo.findOne({ where: { id } });
    return (row as unknown as FestivalEntity) ?? null;
  }

  async create(data: Omit<FestivalEntity, 'id'>): Promise<FestivalEntity> {
    const created = await this.repo.save(this.repo.create(data as any));
    return created as unknown as FestivalEntity;
  }

  async update(id: number, data: Partial<Omit<FestivalEntity, 'id'>>): Promise<FestivalEntity> {
    await this.repo.update({ id }, data as any);
    const row = await this.repo.findOne({ where: { id } });
    return row as unknown as FestivalEntity;
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}


