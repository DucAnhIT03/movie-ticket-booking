import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Poster } from '../../shared/schemas/poster.entity';
import { PosterController } from './controllers/poster.controller';
import { PosterService } from './services/poster.service';
import { PosterRepository } from './repositories/poster.repository';
import { CloudinaryModule } from '../../providers/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Poster]), CloudinaryModule],
  controllers: [PosterController],
  providers: [PosterService, PosterRepository],
  exports: [PosterService],
})
export class PosterModule {}












