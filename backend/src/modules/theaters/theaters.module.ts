import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TheatersController } from './controllers/theaters.controller';
import { TheatersService } from './services/theaters.service';
import { TheatersRepository } from './repositories/theaters.repository';
import { ScreensModule } from '../screens/screens.module';
import { TheaterOrmEntity } from '../../shared/schemas/theater.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([TheaterOrmEntity]), forwardRef(() => ScreensModule)],
  controllers: [TheatersController],
  providers: [TheatersService, TheatersRepository],
  exports: [TheatersService, TheatersRepository],
})
export class TheatersModule {}



