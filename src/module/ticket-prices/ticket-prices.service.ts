import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketPrice, SeatType } from './entities/ticket-price.entity';

@Injectable()
export class TicketPricesService {
  constructor(
    @InjectRepository(TicketPrice)
    private readonly ticketPriceRepository: Repository<TicketPrice>,
  ) {}

  // method name getPrice — keeps controller/service consistent
  async getPrice(type_seat: string, type_movie: string, date: Date, time?: string): Promise<number | null> {
    const dayType = [0,6].includes(date.getDay()) ? 1 : 0;

    const where: any = {
      type_seat: (type_seat as unknown) as SeatType,
      type_movie,
      day_type: dayType,
    };

    // optionally, you could filter by time if start_time/end_time exist
    const ticket = await this.ticketPriceRepository.findOne({ where });
    return ticket ? Number(ticket.price) : null;
  }
}
