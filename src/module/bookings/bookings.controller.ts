import { Controller, Get, Patch, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { FilterBookingDto } from './dto/filter-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('my-tickets')
  getMyTickets(@Req() req, @Query() filter: FilterBookingDto) {
    return this.bookingsService.findAll(req.user.id, filter);
  }

  @Patch('cancel')
  cancel(@Req() req, @Body() dto: CancelBookingDto) {
    return this.bookingsService.cancelBooking(req.user.id, dto);
  }
/*
  @Get('my-tickets/:userId')
getUserBookings(@Param('userId') userId: number) {
  return this.bookingsService.getUserBookings(userId);
}

@Patch('cancel/:id')
cancelBooking(@Param('id') bookingId: number) {
  return this.bookingsService.cancelBooking(bookingId);
}
*/
}
