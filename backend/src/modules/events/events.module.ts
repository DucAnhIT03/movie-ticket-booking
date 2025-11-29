import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventOrmEntity } from '../../shared/schemas/event.orm-entity';
import { EventRegistrationOrmEntity } from '../../shared/schemas/event-registration.orm-entity';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { EventsRepository } from './repositories/events.repository';
import { EventRegistrationsRepository } from './repositories/event-registrations.repository';
import { CloudinaryModule } from '../../providers/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([EventOrmEntity, EventRegistrationOrmEntity]), CloudinaryModule],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository, EventRegistrationsRepository],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}


