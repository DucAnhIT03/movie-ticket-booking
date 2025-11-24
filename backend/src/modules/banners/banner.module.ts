import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from '../../shared/schemas/banners.entity';
import { BannerService } from './services/banner.service';
import { BannerController } from './controllers/banner.controller';
import { BannerRepository } from './repositories/banner.repository';
import { CloudinaryModule } from '../../providers/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Banner]), CloudinaryModule],
  providers: [BannerService, BannerRepository],
  controllers: [BannerController],
})
export class BannerModule {}
