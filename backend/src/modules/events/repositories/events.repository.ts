import type { EventEntity } from '../../../shared/types/event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { EventOrmEntity } from '../../../shared/schemas/event.orm-entity';

@Injectable()
export class EventsRepository {
  constructor(@InjectRepository(EventOrmEntity) private readonly repo: Repository<EventOrmEntity>) {}

  async findAndCount(params: { page: number; limit: number; search?: string; status?: string }): Promise<{ items: EventEntity[]; total: number }>{
    const query = this.repo.createQueryBuilder('event');
    
    if (params.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.where(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('event.id = :searchId', { searchId })
              .orWhere('event.title LIKE :search', { search: `%${params.search}%` })
              .orWhere('event.location LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('event.title LIKE :search', { search: `%${params.search}%` })
              .orWhere('event.location LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }

    if (params.status) {
      query.andWhere('event.status = :status', { status: params.status });
    }
    
    query.orderBy('event.start_time', 'DESC');
    query.skip((params.page - 1) * params.limit).take(params.limit);
    
    const [rows, total] = await query.getManyAndCount();
    return { items: rows as unknown as EventEntity[], total };
  }

  async findById(id: number): Promise<EventEntity | null> {
    const row = await this.repo.findOne({ where: { id } });
    return (row as unknown as EventEntity) ?? null;
  }

  async create(data: Omit<EventEntity, 'id'>): Promise<EventEntity> {
    const created = await this.repo.save(this.repo.create(data as any));
    return created as unknown as EventEntity;
  }

  async update(id: number, data: Partial<Omit<EventEntity, 'id'>>): Promise<EventEntity> {
    await this.repo.update({ id }, { ...data as any, updated_at: new Date() });
    const row = await this.repo.findOne({ where: { id } });
    return row as unknown as EventEntity;
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}


