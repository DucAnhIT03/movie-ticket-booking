import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from '../dtos/request/create-genre.dto';
import { UpdateGenreDto } from '../dtos/request/update-genre.dto';
import { GenreRepository } from '../repositories/genre.repository';
import { MovieGenreRepository } from '../repositories/movie-genre.repository';
import { Brackets } from 'typeorm';
import { Genre } from '../../../shared/schemas/genres.entity';

@Injectable()
export class GenreService {
  constructor(
    private readonly repo: GenreRepository,
    private readonly movieGenreRepo: MovieGenreRepository,
  ) {}

  async create(dto: CreateGenreDto) {
    const name = (dto.genreName || '').trim();
    if (!name) {
      throw new BadRequestException('genreName is required');
    }

    // Nếu đã tồn tại thì báo lỗi rõ ràng để UI hiển thị cho người dùng
    const existing = await this.repo
      .createQueryBuilder('genre')
      .where('LOWER(genre.genreName) = LOWER(:name)', { name })
      .getOne();
    if (existing) {
      throw new BadRequestException(`Thể loại "${name}" đã tồn tại`);
    }

    const g = this.repo.create({ genreName: name });
    try {
      return await this.repo.save(g);
    } catch (e: any) {
      // Fallback an toàn nếu race-condition insert trùng
      const again = await this.repo
        .createQueryBuilder('genre')
        .where('LOWER(genre.genreName) = LOWER(:name)', { name })
        .getOne();
      if (again) {
        throw new BadRequestException(`Thể loại "${name}" đã tồn tại`);
      }
      throw e;
    }
  }

  async createMany(dtos: CreateGenreDto[]) {
    if (!dtos || dtos.length === 0) return [];

    // Normalize + unique theo lowercase để tránh tạo trùng ("Tình cảm" vs "tình cảm")
    const normalized = (dtos || [])
      .map((d) => (d?.genreName || '').trim())
      .filter(Boolean);

    if (normalized.length === 0) return [];

    const uniqueByLower = new Map<string, string>();
    for (const n of normalized) {
      const key = n.toLowerCase();
      if (!uniqueByLower.has(key)) uniqueByLower.set(key, n);
    }

    const namesLower = Array.from(uniqueByLower.keys());

    const existing = await this.repo
      .createQueryBuilder('genre')
      .where('LOWER(genre.genreName) IN (:...namesLower)', { namesLower })
      .getMany();

    const existingLower = new Set(existing.map((g) => (g.genreName || '').toLowerCase()));
    const missing = Array.from(uniqueByLower.entries())
      .filter(([lower]) => !existingLower.has(lower))
      .map(([, original]) => ({ genreName: original }));

    if (missing.length > 0) {
      // MySQL: INSERT IGNORE để không crash nếu có trùng do race-condition
      await this.repo
        .createQueryBuilder('genre')
        .insert()
        .into(Genre)
        .values(missing)
        .orIgnore()
        .execute();
    }

    // Trả về danh sách đầy đủ theo input (unique)
    return this.repo
      .createQueryBuilder('genre')
      .where('LOWER(genre.genreName) IN (:...namesLower)', { namesLower })
      .orderBy('genre.genreName', 'ASC')
      .getMany();
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
