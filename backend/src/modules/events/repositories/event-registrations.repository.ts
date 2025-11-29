import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRegistrationOrmEntity } from '../../../shared/schemas/event-registration.orm-entity';
import type { EventRegistrationEntity } from '../../../shared/types/event-registration';

@Injectable()
export class EventRegistrationsRepository {
  constructor(
    @InjectRepository(EventRegistrationOrmEntity)
    private readonly repo: Repository<EventRegistrationOrmEntity>,
  ) {}

  async create(data: Omit<EventRegistrationEntity, 'id' | 'created_at'>): Promise<EventRegistrationEntity> {
    const created = this.repo.create(data as any);
    const saved = await this.repo.save(created);
    return saved as unknown as EventRegistrationEntity;
  }

  async findByEvent(eventId: number): Promise<EventRegistrationEntity[]> {
    const rows = await this.repo.find({
      where: { event_id: eventId },
      order: { created_at: 'DESC' },
    });
    return rows as unknown as EventRegistrationEntity[];
  }

  async countByEventIds(eventIds: number[]): Promise<Record<number, number>> {
    if (eventIds.length === 0) {
      return {};
    }
    const rows = await this.repo
      .createQueryBuilder('reg')
      .select('reg.event_id', 'event_id')
      .addSelect('COUNT(reg.id)', 'total')
      .where('reg.event_id IN (:...eventIds)', { eventIds })
      .groupBy('reg.event_id')
      .getRawMany<{ event_id: number; total: string }>();

    return rows.reduce<Record<number, number>>((acc, row) => {
      acc[row.event_id] = Number(row.total);
      return acc;
    }, {});
  }
}




