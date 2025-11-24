import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FestivalOrmEntity } from '../../shared/schemas/festival.orm-entity';
import { FestivalsController } from './controllers/festivals.controller';
import { FestivalsService } from './services/festivals.service';
import { FestivalsRepository } from './repositories/festivals.repository';
import { CloudinaryModule } from '../../providers/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([FestivalOrmEntity]), CloudinaryModule],
  controllers: [FestivalsController],
  providers: [FestivalsService, FestivalsRepository],
  exports: [FestivalsService, FestivalsRepository],
})
export class FestivalsModule {}





