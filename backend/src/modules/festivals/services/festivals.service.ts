import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { FestivalEntity } from '../../../shared/types/festival';
import { FestivalsRepository } from '../repositories/festivals.repository';
import { CreateFestivalRequestDto, UpdateFestivalRequestDto } from '../dtos/request/festivals.request.dto';

@Injectable()
export class FestivalsService {
  constructor(private readonly repo: FestivalsRepository) {}

  async findAll(params?: { page?: number; limit?: number; search?: string }): Promise<{ items: FestivalEntity[]; total: number; page: number; limit: number; totalPages: number }>{
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, Math.min(100, params?.limit ?? 10));
    const { items, total } = await this.repo.findAndCount({ page, limit, search: params?.search });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<FestivalEntity> {
    const ent = await this.repo.findById(id);
    if (!ent) throw new NotFoundException('Festival not found');
    return ent;
  }

  async create(payload: CreateFestivalRequestDto): Promise<FestivalEntity> {
    const start = new Date(payload.start_time);
    const end = new Date(payload.end_time);
    const now = new Date();
    if (start < now) throw new BadRequestException('start_time must be >= now');
    if (end < start) throw new BadRequestException('end_time must be >= start_time');
    return this.repo.create({
      title: payload.title,
      image: payload.image ?? null,
      content: payload.content ?? null,
      start_time: start,
      end_time: end,
      id: 0 as any,
    } as FestivalEntity);
  }

  async update(id: number, payload: UpdateFestivalRequestDto): Promise<FestivalEntity> {
    const existing = await this.findOne(id);
    const start = payload.start_time ? new Date(payload.start_time) : existing.start_time;
    const end = payload.end_time ? new Date(payload.end_time) : existing.end_time;
    if (end < start) throw new BadRequestException('end_time must be >= start_time');
    return this.repo.update(id, {
      title: payload.title ?? existing.title,
      image: payload.image ?? existing.image,
      content: payload.content ?? existing.content,
      start_time: start,
      end_time: end,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.remove(id);
  }
}


