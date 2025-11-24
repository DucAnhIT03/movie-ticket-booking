import type { ScreenEntity } from '../../../shared/types/screen';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Screen } from '../../../shared/schemas/screen.entity';
import { Showtime } from '../../../shared/schemas/showtime.entity';

const mapToOrm = (data: Partial<ScreenEntity>): Partial<Screen> => {
  const entity: Partial<Screen> = {};

  if (data.name !== undefined) {
    entity.name = data.name;
  }
  if (data.seat_capacity !== undefined) {
    entity.seatCapacity = data.seat_capacity;
  }
  if (data.theater_id !== undefined) {
    entity.theaterId = data.theater_id;
  }
  if (data.created_at !== undefined) {
    entity.createdAt = data.created_at;
  }
  if (data.updated_at !== undefined) {
    entity.updatedAt = data.updated_at ?? undefined;
  }

  return entity;
};

const mapToDomain = (row: Screen): ScreenEntity => ({
  id: row.id,
  name: row.name,
  seat_capacity: row.seatCapacity,
  theater_id: row.theaterId,
  created_at: row.createdAt,
  updated_at: row.updatedAt ?? null,
});

@Injectable()
export class ScreensRepository {
  constructor(@InjectRepository(Screen) private readonly repo: Repository<Screen>) {}

  async findAndCount(params: { 
    page: number; 
    limit: number; 
    search?: string; 
    theater_id?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: ScreenEntity[]; total: number }> {
    const query = this.repo.createQueryBuilder('screen');
    
    if (params.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.where(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('screen.id = :searchId', { searchId })
              .orWhere('screen.name LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('screen.name LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }

    if (params.theater_id) {
      query.andWhere('screen.theater_id = :theaterId', { theaterId: params.theater_id });
    }

    // Sort
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder?.toUpperCase() || 'DESC';
    const validSortColumns = ['id', 'name', 'seat_capacity', 'theater_id', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    
    query.orderBy(`screen.${sortColumn}`, sortOrder as 'ASC' | 'DESC');
    
    // Pagination
    query.skip((params.page - 1) * params.limit).take(params.limit);
    
    const [rows, total] = await query.getManyAndCount();
    return { items: rows.map(mapToDomain), total };
  }

  async create(data: Omit<ScreenEntity, 'id' | 'created_at' | 'updated_at'>): Promise<ScreenEntity> {
    const created = await this.repo.save(this.repo.create(mapToOrm(data)));
    return mapToDomain(created);
  }

  async findByTheaterId(theaterId: number): Promise<ScreenEntity[]> {
    const rows = await this.repo.find({ where: { theaterId } });
    return rows.map(mapToDomain);
  }

  async findById(id: number): Promise<ScreenEntity | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? mapToDomain(row) : null;
  }

  async hasShowtimes(screenId: number): Promise<boolean> {
    const count = await this.repo.manager.count(Showtime, { where: { screenId } });
    return count > 0;
  }

  async update(id: number, data: Partial<Omit<ScreenEntity, 'id' | 'created_at'>>): Promise<ScreenEntity> {
    await this.repo.update({ id }, { ...mapToOrm(data), updatedAt: new Date() });
    const row = await this.repo.findOne({ where: { id } });
    return mapToDomain(row!);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}



