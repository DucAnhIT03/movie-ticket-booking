import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { FilterBookingDto } from './dto/filter-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,
  ) {}

  async findAll(userId: number, filter: FilterBookingDto) {
    const where: any = { user: { id: userId } };
    if (filter?.status) where.status = filter.status;

    return this.bookingRepo.find({
      where,
      relations: ['showtime', 'seats', 'payments'],
      order: { created_at: 'DESC' },
    });
  }

  async cancelBooking(userId: number, dto: CancelBookingDto) {
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
      relations: ['showtime', 'user'],
    });
    if (!booking) throw new NotFoundException('Không tìm thấy vé');
    if (booking.user?.id !== userId) throw new BadRequestException('Không phải vé của bạn');
    if (booking.status === 'CANCELLED') throw new BadRequestException('Vé đã bị hủy trước đó');

    const showtime = booking.showtime;
    if (!showtime) throw new BadRequestException('Không tìm thấy suất chiếu');

    if (new Date(showtime.startTime) <= new Date()) {
      throw new BadRequestException('Không thể hủy vé sau khi suất chiếu đã bắt đầu');
    }

    booking.status = 'CANCELLED';
    await this.bookingRepo.save(booking);

    return { message: 'Hủy vé thành công', booking };
  }
}
