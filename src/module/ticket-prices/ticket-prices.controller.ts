import { Controller, Get, Query } from '@nestjs/common';
import { TicketPricesService } from './ticket-prices.service';

@Controller('ticket-prices')
export class TicketPricesController {
  constructor(private readonly ticketPricesService: TicketPricesService) {}

  @Get()
  async getPrice(
    @Query('typeSeat') typeSeat: string,
    @Query('typeMovie') typeMovie: string,
    @Query('date') date: string,
    @Query('time') time: string,
  ) {
    return this.ticketPricesService.getPrice(
      typeSeat,
      typeMovie,
      new Date(date),
      time,
    );
  }
}
