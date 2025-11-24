import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannerPoster } from '../../shared/schemas/banner-poster.entity';
import { BannerPosterController } from './controllers/banner-poster.controller';
import { BannerPosterService } from './services/banner-poster.service';
import { BannerPosterRepository } from './repositories/banner-poster.repository';
import { CloudinaryModule } from '../../providers/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([BannerPoster]), CloudinaryModule],
  controllers: [BannerPosterController],
  providers: [BannerPosterService, BannerPosterRepository],
  exports: [BannerPosterService],
})
export class BannerPosterModule {}












