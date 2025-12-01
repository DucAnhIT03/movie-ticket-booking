import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TheatersRepository } from '../repositories/theaters.repository';
import type { TheaterEntity } from '../../../shared/types/theater';
import { CreateTheaterRequestDto, UpdateTheaterRequestDto } from '../dtos/request/theaters.request.dto';
import { ScreensRepository } from '../../screens/repositories/screens.repository';

@Injectable()
export class TheatersService {
  constructor(
    private readonly theatersRepo: TheatersRepository,
    private readonly screensRepo: ScreensRepository,
  ) {}

  async create(payload: CreateTheaterRequestDto): Promise<TheaterEntity> {
    const normalizedName = payload.name.trim();
    const normalizedLocation = payload.location.trim();

    const duplicated = await this.theatersRepo.findByNameAndLocation(normalizedName, normalizedLocation);
    if (duplicated) {
      throw new BadRequestException('Đã tồn tại rạp có cùng tên và địa chỉ.');
    }

    try {
      return await this.theatersRepo.create({
        ...payload,
        name: normalizedName,
        location: normalizedLocation,
      });
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

    const { items, total } = await this.theatersRepo.findAndCount({
      page,
      limit,
      search,
      location,
      sortBy,
      sortOrder,
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<TheaterEntity> {
    const ent = await this.theatersRepo.findById(id);
    if (!ent) throw new NotFoundException('Theater not found');
    return ent;
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

    return this.theatersRepo.update(id, {
      ...payload,
      name: nameToUse,
      location: locationToUse,
    });
  }

  async remove(id: number): Promise<void> {
    const screens = await this.screensRepo.findByTheaterId(id);
    if (screens.length > 0) {
      throw new BadRequestException('Không thể xóa rạp vì vẫn còn phòng chiếu.');
    }
    await this.theatersRepo.remove(id);
  }
}



