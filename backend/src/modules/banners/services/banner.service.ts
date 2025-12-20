import { Injectable, NotFoundException } from '@nestjs/common';
import { Like } from 'typeorm';
import { CreateBannerDto } from '../dtos/request/create-banner.dto';
import { UpdateBannerDto } from '../dtos/request/update-banner.dto';
import { BannerRepository } from '../repositories/banner.repository';
import { RedisCacheService } from '../../../providers/redis-cache';

@Injectable()
export class BannerService {
  constructor(
    private bannersRepo: BannerRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  async create(dto: CreateBannerDto) {
    const banner = this.bannersRepo.create(dto as any);
    const result = await this.bannersRepo.save(banner);
   
    await this.cacheService.invalidateBanners();
    return result;
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
    const result = await this.bannersRepo.save(banner);
    
    await this.cacheService.invalidateBanners();
    return result;
  }

  async remove(id: number) {
    const banner = await this.bannersRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    await this.bannersRepo.remove(banner);
   
    await this.cacheService.invalidateBanners();
    return { success: true };
  }

  async searchAndPaginate(search?: string, page = 1, limit = 10) {
    const cacheKey = this.cacheService.generateKey(
      RedisCacheService.KEYS.BANNERS,
      'list',
      `p${page}`,
      `l${limit}`,
      `s${search || ''}`
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const queryOptions: any = {
            skip: (page - 1) * limit,
            take: limit,
            order: { id: 'ASC' },
          };

          if (search && search.trim()) {
         
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
      },
      RedisCacheService.TTL.LONG // 30 minutes - banners rarely change
    );
  }

  async findAllNoPaging(search?: string) {
    const cacheKey = this.cacheService.generateKey(
      RedisCacheService.KEYS.BANNERS,
      'all',
      `s${search || ''}`
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
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
      },
      RedisCacheService.TTL.LONG
    );
  }
}
