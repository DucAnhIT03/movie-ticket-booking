import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketPrice } from './entities/ticket-price.entity';
import { TicketPricesService } from './ticket-prices.service';

@Module({
  imports: [TypeOrmModule.forFeature([TicketPrice])],
  providers: [TicketPricesService],
  exports: [TicketPricesService],
})
export class TicketPricesModule {}
