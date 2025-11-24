import { BadRequestException, Injectable } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { News } from '../../../shared/schemas/news.entity';
import { CreateNewsDto } from '../dtos/request/create-news.dto';
import { UpdateNewsDto } from '../dtos/request/update-news.dto';
import { NewsRepository } from '../repositories/news.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { FestivalOrmEntity } from '../../../shared/schemas/festival.orm-entity';

@Injectable()
export class NewsService {
  constructor(
    private readonly newsRepo: NewsRepository,
    @InjectRepository(FestivalOrmEntity) private readonly festivalRepo: Repository<FestivalOrmEntity>,
  ) {}

  async create(dto: CreateNewsDto) {
    if (dto.festivalId != null) {
      const exists = await this.festivalRepo.exist({ where: { id: dto.festivalId } });
      if (!exists) throw new BadRequestException('festivalId does not exist');
    }
    const entity = this.newsRepo.create({
      title: dto.title,
      content: dto.content ?? null,
      image: dto.image ?? null,
      festivalId: dto.festivalId ?? null,
    } as Partial<News>);
    return this.newsRepo.save(entity);
  }

  async findOne(id: number) {
    return this.newsRepo.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateNewsDto) {
    if (dto.festivalId != null) {
      const exists = await this.festivalRepo.exist({ where: { id: dto.festivalId } });
      if (!exists) throw new BadRequestException('festivalId does not exist');
    }
    await this.newsRepo.update(id, {
      title: dto.title,
      content: dto.content,
      image: dto.image,
      festivalId: dto.festivalId,
    });
    return this.findOne(id);
  }

  async remove(id: number) {
    const res = await this.newsRepo.delete(id);
    return res.affected && res.affected > 0;
  }

  async searchAndPaginate(search?: string, page = 1, limit = 2) {
    const where = search
      ? [{ title: Like(`%${search}%`) }, { content: Like(`%${search}%`) }]
      : {};

    const [items, total] = await this.newsRepo.findAndCount({
      where,
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async findAll() {
    return this.newsRepo.find({ order: { createdAt: 'ASC' } });
  }
}
