import { Injectable, NotFoundException } from '@nestjs/common';
import { Like } from 'typeorm';
import { CreateBannerDto } from '../dtos/request/create-banner.dto';
import { UpdateBannerDto } from '../dtos/request/update-banner.dto';
import { BannerRepository } from '../repositories/banner.repository';

@Injectable()
export class BannerService {
  constructor(private bannersRepo: BannerRepository) {}

  async create(dto: CreateBannerDto) {
    const banner = this.bannersRepo.create(dto as any);
    return this.bannersRepo.save(banner);
  }

  async findOne(id: number) {
    const b = await this.bannersRepo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Banner not found');
    return b;
  }

  async update(id: number, dto: UpdateBannerDto) {
    const banner = await this.bannersRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    Object.assign(banner, dto);
    return this.bannersRepo.save(banner);
  }

  async remove(id: number) {
    const banner = await this.bannersRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    await this.bannersRepo.remove(banner);
    return { success: true };
  }

  async searchAndPaginate(search?: string, page = 1, limit = 10) {
    try {
      const queryOptions: any = {
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'ASC' },
      };

      if (search && search.trim()) {
        // Chỉ search trong url vì position là enum
        queryOptions.where = {
          url: Like(`%${search.trim()}%`),
        };
      }

      const [items, total] = await this.bannersRepo.findAndCount(queryOptions);
      return {
        items: items || [],
        meta: { 
          total: total || 0, 
          page: page || 1, 
          limit: limit || 10, 
          pageCount: Math.ceil((total || 0) / (limit || 10)) 
        },
      };
    } catch (error) {
      console.error('Error in searchAndPaginate:', error);
      // Trả về empty result thay vì throw error
      return {
        items: [],
        meta: { total: 0, page: page || 1, limit: limit || 10, pageCount: 0 },
      };
    }
  }

  async findAllNoPaging(search?: string) {
    try {
      const queryOptions: any = {
        order: { id: 'ASC' },
      };

      if (search && search.trim()) {
        // Chỉ search trong url vì position là enum
        queryOptions.where = {
          url: Like(`%${search.trim()}%`),
        };
      }

      const result = await this.bannersRepo.find(queryOptions);
      return result || [];
    } catch (error) {
      console.error('Error in findAllNoPaging:', error);
      // Trả về empty array thay vì throw error
      return [];
    }
  }
}
