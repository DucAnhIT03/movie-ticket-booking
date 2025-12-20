import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TheatersRepository } from '../repositories/theaters.repository';
import type { TheaterEntity } from '../../../shared/types/theater';
import { CreateTheaterRequestDto, UpdateTheaterRequestDto } from '../dtos/request/theaters.request.dto';
import { ScreensRepository } from '../../screens/repositories/screens.repository';
import { RedisCacheService } from '../../../providers/redis-cache';

@Injectable()
export class TheatersService {
  constructor(
    private readonly theatersRepo: TheatersRepository,
    private readonly screensRepo: ScreensRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  async create(payload: CreateTheaterRequestDto): Promise<TheaterEntity> {
    const normalizedName = payload.name.trim();
    const normalizedLocation = payload.location.trim();

    const duplicated = await this.theatersRepo.findByNameAndLocation(normalizedName, normalizedLocation);
    if (duplicated) {
      throw new BadRequestException('Đã tồn tại rạp có cùng tên và địa chỉ.');
    }

    try {
      const result = await this.theatersRepo.create({
        ...payload,
        name: normalizedName,
        location: normalizedLocation,
      });
      
      // Invalidate cache after creating
      await this.cacheService.invalidateTheaters();
      
      return result;
    } catch (error) {
      if (error.code === 'ER_DATA_TOO_LONG') {
        throw new BadRequestException('Dữ liệu quá dài. Vui lòng kiểm tra lại thông tin nhập vào.');
      }
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Rạp chiếu với thông tin này đã tồn tại.');
      }
      throw new BadRequestException(`Không thể tạo rạp chiếu: ${error.message || 'Lỗi không xác định'}`);
    }
  }

  async findAll(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'; search?: string; location?: string }): Promise<{ items: TheaterEntity[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, Math.min(100, params?.limit ?? 10));
    const sortBy = params?.sortBy ?? 'created_at';
    const sortOrder = params?.sortOrder ?? 'desc';
    const search = params?.search?.trim() || undefined;
    const location = params?.location?.trim() || undefined;

    // Generate cache key
    const cacheKey = this.cacheService.generateKey(
      RedisCacheService.KEYS.THEATERS,
      'list',
      `p${page}`,
      `l${limit}`,
      `sb${sortBy}`,
      `so${sortOrder}`,
      `s${search || ''}`,
      `loc${location || ''}`
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const { items, total } = await this.theatersRepo.findAndCount({
          page,
          limit,
          search,
          location,
          sortBy,
          sortOrder,
        });

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
      },
      RedisCacheService.TTL.LONG // 30 minutes - theaters rarely change
    );
  }

  async findOne(id: number): Promise<TheaterEntity> {
    const cacheKey = this.cacheService.generateKey(RedisCacheService.KEYS.THEATER, id);
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const ent = await this.theatersRepo.findById(id);
        if (!ent) throw new NotFoundException('Theater not found');
        return ent;
      },
      RedisCacheService.TTL.LONG
    );
  }

  async update(id: number, payload: UpdateTheaterRequestDto): Promise<TheaterEntity> {
    const theater = await this.theatersRepo.findById(id);
    if (!theater) {
      throw new NotFoundException('Theater not found');
    }

    const nameToUse = payload.name?.trim() ?? theater.name;
    const locationToUse = payload.location?.trim() ?? theater.location;

    if (payload.name || payload.location) {
      const duplicated = await this.theatersRepo.findByNameAndLocation(nameToUse, locationToUse, id);
      if (duplicated) {
        throw new BadRequestException('Đã tồn tại rạp có cùng tên và địa chỉ.');
      }
    }

    const result = await this.theatersRepo.update(id, {
      ...payload,
      name: nameToUse,
      location: locationToUse,
    });
    
    // Invalidate cache after update
    await this.cacheService.invalidateTheaters(id);
    
    return result;
  }

  async remove(id: number): Promise<void> {
    const screens = await this.screensRepo.findByTheaterId(id);
    if (screens.length > 0) {
      throw new BadRequestException('Không thể xóa rạp vì vẫn còn phòng chiếu.');
    }
    await this.theatersRepo.remove(id);
    
    // Invalidate cache after delete
    await this.cacheService.invalidateTheaters(id);
  }
}



