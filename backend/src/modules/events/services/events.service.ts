import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { EventEntity } from '../../../shared/types/event';
import { EventsRepository } from '../repositories/events.repository';
import { CreateEventRequestDto, UpdateEventRequestDto } from '../dtos/request/events.request.dto';

@Injectable()
export class EventsService {
  constructor(private readonly repo: EventsRepository) {}

  async findAll(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ items: EventEntity[]; total: number; page: number; limit: number; totalPages: number }>{
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, Math.min(100, params?.limit ?? 10));
    const { items, total } = await this.repo.findAndCount({ page, limit, search: params?.search, status: params?.status });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<EventEntity> {
    const ent = await this.repo.findById(id);
    if (!ent) throw new NotFoundException('Event not found');
    return ent;
  }

  async create(payload: CreateEventRequestDto): Promise<EventEntity> {
    const start = new Date(payload.start_time);
    const end = new Date(payload.end_time);
    const now = new Date();
    
    if (end < start) throw new BadRequestException('end_time must be >= start_time');
    
    // Auto-update status based on time
    let status: EventEntity['status'] = payload.status || 'UPCOMING';
    if (start <= now && end >= now) {
      status = 'ONGOING';
    } else if (end < now) {
      status = 'COMPLETED';
    }
    
    return this.repo.create({
      title: payload.title,
      description: payload.description ?? null,
      image: payload.image ?? null,
      location: payload.location ?? null,
      start_time: start,
      end_time: end,
      status,
      created_at: new Date(),
      updated_at: null,
      id: 0 as any,
    } as EventEntity);
  }

  async update(id: number, payload: UpdateEventRequestDto): Promise<EventEntity> {
    const existing = await this.findOne(id);
    const start = payload.start_time ? new Date(payload.start_time) : existing.start_time;
    const end = payload.end_time ? new Date(payload.end_time) : existing.end_time;
    
    if (end < start) throw new BadRequestException('end_time must be >= start_time');
    
    // Auto-update status based on time if not explicitly set
    let status = payload.status ?? existing.status;
    const now = new Date();
    if (!payload.status) {
      if (start <= now && end >= now) {
        status = 'ONGOING';
      } else if (end < now) {
        status = 'COMPLETED';
      } else if (start > now) {
        status = 'UPCOMING';
      }
    }
    
    return this.repo.update(id, {
      title: payload.title ?? existing.title,
      description: payload.description !== undefined ? payload.description : existing.description,
      image: payload.image !== undefined ? payload.image : existing.image,
      location: payload.location !== undefined ? payload.location : existing.location,
      start_time: start,
      end_time: end,
      status,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.remove(id);
  }
}


