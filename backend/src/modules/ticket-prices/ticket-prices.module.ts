import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketPrice } from '../../shared/schemas/ticket-price.entity';
import { TicketPricesService } from './services/ticket-prices.service';
import { TicketPricesController } from './controllers/ticket-prices.controller';
import { TicketPriceRepository } from './repositories/ticket-price.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TicketPrice])],
  controllers :[TicketPricesController],
  providers: [TicketPricesService, TicketPriceRepository],
  exports: [TicketPricesService],
})
export class TicketPricesModule {}
