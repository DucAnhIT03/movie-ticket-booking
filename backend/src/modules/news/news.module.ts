import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from '../../shared/schemas/news.entity';
import { FestivalOrmEntity } from '../../shared/schemas/festival.orm-entity';
import { NewsService } from './services/news.service';
import { NewsController } from './controllers/news.controller';
import { NewsRepository } from './repositories/news.repository';

@Module({
  imports: [TypeOrmModule.forFeature([News, FestivalOrmEntity])],
  providers: [NewsService, NewsRepository],
  controllers: [NewsController],
  exports: [NewsService],
})
export class NewsModule {}
