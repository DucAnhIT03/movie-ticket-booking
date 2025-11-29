import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ScreensRepository } from '../repositories/screens.repository';
import type { ScreenEntity } from '../../../shared/types/screen';
import { CreateScreenRequestDto, UpdateScreenRequestDto } from '../dtos/request/screens.request.dto';
import { TheatersRepository } from '../../theaters/repositories/theaters.repository';

@Injectable()
export class ScreensService {
  constructor(
    private readonly screensRepo: ScreensRepository,
    private readonly theatersRepo: TheatersRepository,
  ) {}

  async create(payload: CreateScreenRequestDto): Promise<ScreenEntity> {
    const theater = await this.theatersRepo.findById(payload.theater_id);
    if (!theater) throw new BadRequestException('theater_id does not exist');
    if (payload.seat_capacity < 0) throw new BadRequestException('seat_capacity must be >= 0');
    return this.screensRepo.create(payload);
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    theater_id?: number;
  }): Promise<{ items: ScreenEntity[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, Math.min(100, params?.limit ?? 10));

    // Map tên cột ở API sang tên thuộc tính entity để TypeORM hiểu đúng
    const sortByMap: Record<string, string> = {
      id: 'id',
      name: 'name',
      seat_capacity: 'seatCapacity',
      theater_id: 'theaterId',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
    };

    const requestedSortBy = params?.sortBy;
    const sortBy = requestedSortBy && sortByMap[requestedSortBy] ? sortByMap[requestedSortBy] : 'createdAt';
    const sortOrder = params?.sortOrder ?? 'desc';
    const search = params?.search?.trim() || undefined;
    const theaterId = params?.theater_id;

    const { items, total } = await this.screensRepo.findAndCount({
      page,
      limit,
      search,
      theater_id: theaterId,
      sortBy,
      sortOrder,
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<ScreenEntity> {
    const ent = await this.screensRepo.findById(id);
    if (!ent) throw new NotFoundException('Screen not found');
    return ent;
  }

  async update(id: number, payload: UpdateScreenRequestDto): Promise<ScreenEntity> {
    if (payload.theater_id != null) {
      const theater = await this.theatersRepo.findById(payload.theater_id);
      if (!theater) throw new BadRequestException('theater_id does not exist');
    }
    if (payload.seat_capacity != null && payload.seat_capacity < 0) {
      throw new BadRequestException('seat_capacity must be >= 0');
    }
    return this.screensRepo.update(id, payload);
  }

  async remove(id: number): Promise<void> {
    const hasShowtimes = await this.screensRepo.hasShowtimes(id);
    if (hasShowtimes) {
      throw new BadRequestException('Không thể xóa phòng chiếu vì vẫn còn suất chiếu.');
    }
    await this.screensRepo.remove(id);
  }
}



