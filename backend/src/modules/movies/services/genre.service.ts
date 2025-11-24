import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from '../dtos/request/create-genre.dto';
import { UpdateGenreDto } from '../dtos/request/update-genre.dto';
import { GenreRepository } from '../repositories/genre.repository';
import { MovieGenreRepository } from '../repositories/movie-genre.repository';
import { Brackets } from 'typeorm';

@Injectable()
export class GenreService {
  constructor(
    private readonly repo: GenreRepository,
    private readonly movieGenreRepo: MovieGenreRepository,
  ) {}

  async create(dto: CreateGenreDto) {
    const g = this.repo.create({ genreName: dto.genreName });
    return this.repo.save(g);
  }

  async createMany(dtos: CreateGenreDto[]) {
    if (!dtos || dtos.length === 0) return [];
    const entities = dtos.map((d) =>
      this.repo.create({ genreName: d.genreName }),
    );
    return this.repo.save(entities);
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 10));
    const skip = (page - 1) * limit;

    const query = this.repo.createQueryBuilder('genre');

    if (params?.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.where(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('genre.id = :searchId', { searchId })
              .orWhere('genre.genreName LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('genre.genreName LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }

    query.orderBy('genre.genreName', 'ASC');
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const g = await this.repo.findOne({ where: { id } });
    if (!g) throw new NotFoundException('Genre not found');
    return g;
  }

  async update(id: number, dto: UpdateGenreDto) {
    const g = await this.findOne(id);
    Object.assign(g, dto);
    return this.repo.save(g);
  }

  async remove(id: number) {
    const g = await this.findOne(id);
    const usageCount = await this.movieGenreRepo.countByGenreId(id);
    if (usageCount > 0) {
      throw new BadRequestException('Không thể xóa thể loại vì vẫn còn phim thuộc thể loại này.');
    }
    await this.repo.remove(g);
    return { success: true };
  }
}
