import { Controller, Get, Param, Patch } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Movie } from '../movies/entities/movie.entity';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('user/:userId')
  getUserTickets(@Param('userId') userId: number) {
    return this.ticketsService.getUserTickets(userId);
  }

  @Patch('cancel/:id')
  cancelTicket(@Param('id') bookingId: number) {
    return this.ticketsService.cancelTicket(bookingId, 1 );
  }
}
