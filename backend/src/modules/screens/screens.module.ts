import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScreensController } from './controllers/screens.controller';
import { ScreensService } from './services/screens.service';
import { ScreensRepository } from './repositories/screens.repository';
import { TheatersModule } from '../theaters/theaters.module';
import { Screen } from '../../shared/schemas/screen.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Screen]), forwardRef(() => TheatersModule)],
  controllers: [ScreensController],
  providers: [ScreensService, ScreensRepository],
  exports: [ScreensService, ScreensRepository],
})
export class ScreensModule {}



