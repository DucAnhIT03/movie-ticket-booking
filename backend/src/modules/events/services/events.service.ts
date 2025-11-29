import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { EventEntity } from '../../../shared/types/event';
import type { EventRegistrationEntity } from '../../../shared/types/event-registration';
import { EventsRepository } from '../repositories/events.repository';
import { EventRegistrationsRepository } from '../repositories/event-registrations.repository';
import { CreateEventRequestDto, UpdateEventRequestDto } from '../dtos/request/events.request.dto';
import { CreateEventRegistrationRequestDto } from '../dtos/request/create-event-registration.request.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly repo: EventsRepository,
    private readonly registrationsRepo: EventRegistrationsRepository,
  ) {}

  async findAll(params?: { page?: number; limit?: number; search?: string; status?: string; is_special?: boolean }): Promise<{ items: EventEntity[]; total: number; page: number; limit: number; totalPages: number }>{
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, Math.min(100, params?.limit ?? 10));
    const { items, total } = await this.repo.findAndCount({ page, limit, search: params?.search, status: params?.status, is_special: params?.is_special });
    const counts = await this.registrationsRepo.countByEventIds(items.map((i) => i.id));
    const mapped = items.map((item) => ({
      ...item,
      registrations_count: counts[item.id] ?? 0,
    }));
    return { items: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
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
    
  
    let status: EventEntity['status'] = payload.status || 'UPCOMING';
    if (start <= now && end >= now) {
      status = 'ONGOING';
    } else if (end < now) {
      status = 'COMPLETED';
    }
    
    return this.repo.create({
      title: payload.title,
      description: payload.description ?? null,
      content: payload.content ?? null,
      image: payload.image ?? null,
      location: payload.location ?? null,
      start_time: start,
      end_time: end,
      status,
      is_special: Boolean(payload.is_special),
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
      content: payload.content !== undefined ? payload.content : existing.content,
      image: payload.image !== undefined ? payload.image : existing.image,
      location: payload.location !== undefined ? payload.location : existing.location,
      start_time: start,
      end_time: end,
      status,
      is_special: payload.is_special !== undefined ? Boolean(payload.is_special) : existing.is_special,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.remove(id);
  }

  async createRegistration(eventId: number, payload: CreateEventRegistrationRequestDto): Promise<EventRegistrationEntity> {
    await this.findOne(eventId);
    return this.registrationsRepo.create({
      event_id: eventId,
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      note: payload.note ?? null,
      created_at: new Date(),
    } as EventRegistrationEntity);
  }

  async listRegistrations(eventId: number): Promise<EventRegistrationEntity[]> {
    await this.findOne(eventId);
    return this.registrationsRepo.findByEvent(eventId);
  }
}


