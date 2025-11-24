import type { TheaterEntity } from '../../../shared/types/theater';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { TheaterOrmEntity } from '../../../shared/schemas/theater.orm-entity';

@Injectable()
export class TheatersRepository {
  constructor(@InjectRepository(TheaterOrmEntity) private readonly repo: Repository<TheaterOrmEntity>) {}

  async findAndCount(params: { 
    page: number; 
    limit: number; 
    search?: string; 
    location?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: TheaterEntity[]; total: number }> {
    const query = this.repo.createQueryBuilder('theater');
    
    if (params.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.where(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('theater.id = :searchId', { searchId })
              .orWhere('theater.name LIKE :search', { search: `%${params.search}%` })
              .orWhere('theater.location LIKE :search', { search: `%${params.search}%` })
              .orWhere('theater.phone LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('theater.name LIKE :search', { search: `%${params.search}%` })
              .orWhere('theater.location LIKE :search', { search: `%${params.search}%` })
              .orWhere('theater.phone LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }

    if (params.location) {
      query.andWhere('theater.location LIKE :location', { location: `%${params.location}%` });
    }

    // Sort
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder?.toUpperCase() || 'DESC';
    const validSortColumns = ['id', 'name', 'location', 'phone', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    
    query.orderBy(`theater.${sortColumn}`, sortOrder as 'ASC' | 'DESC');
    
    // Pagination
    query.skip((params.page - 1) * params.limit).take(params.limit);
    
    const [rows, total] = await query.getManyAndCount();
    return { items: rows as unknown as TheaterEntity[], total };
  }

  async create(data: Omit<TheaterEntity, 'id' | 'created_at' | 'updated_at'>): Promise<TheaterEntity> {
    // Sử dụng raw query để chỉ insert các field cần thiết, không set updated_at
    const result = await this.repo
      .createQueryBuilder()
      .insert()
      .into('Theaters')
      .values({
        name: data.name,
        location: data.location,
        phone: data.phone,
      })
      .execute();
    
    const id = result.identifiers[0].id;
    const created = await this.repo.findOne({ where: { id } });
    return created as unknown as TheaterEntity;
  }

  async findById(id: number): Promise<TheaterEntity | null> {
    const row = await this.repo.findOne({ where: { id } });
    return (row as unknown as TheaterEntity) ?? null;
  }

  async update(id: number, data: Partial<Omit<TheaterEntity, 'id' | 'created_at'>>): Promise<TheaterEntity> {
    await this.repo.update({ id }, { ...(data as any), updated_at: new Date() });
    const row = await this.repo.findOne({ where: { id } });
    return row as unknown as TheaterEntity;
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}



