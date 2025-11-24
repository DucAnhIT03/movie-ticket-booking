// src/modules/tickets/tickets.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Booking } from 'src/shared/schemas/booking.entity';
import { Payment } from 'src/shared/schemas/payment.entity';
import { BookingSeat } from 'src/shared/schemas/booking-seat.entity';
import { Seat } from 'src/shared/schemas/seat.entity';
import { Showtime } from 'src/shared/schemas/showtime.entity';
import { Users } from 'src/shared/schemas/users.entity';
import { PaymentStatus } from '../../../common/constrants/enums';
import { BookingRepository } from '../repositories/booking.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { BookingSeatRepository } from '../repositories/booking-seat.repository';

@Injectable()
export class TicketsService {
  constructor(
    private bookingRepo: BookingRepository,
    private paymentRepo: PaymentRepository,
    private bookingSeatRepo: BookingSeatRepository,
    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,
    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
  ) {}

  async getUserTickets(userId: number) {
    return this.bookingRepo.find({
      where: { userId },
      relations: ['showtime', 'showtime.movie', 'bookingSeats', 'bookingSeats.seat', 'payments'],
      order: { created_at: 'DESC' },
    });
  }

  async cancelTicket(bookingId: number, userId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId } as any,
      relations: ['payments', 'user', 'showtime'],
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.user?.id !== userId)
      throw new BadRequestException('Not your booking');

    const hasCompleted = (booking.payments || []).some(
      (p) => p.payment_status === 'COMPLETED',
    );
    if (hasCompleted) {
      throw new BadRequestException(
        'Cannot cancel a booking with completed payment',
      );
    }

    if (booking.showtime && new Date(booking.showtime.startTime) <= new Date()) {
      throw new BadRequestException('Cannot cancel after showtime started');
    }

    // Cập nhật các payment liên quan thành CANCELLED
    if (booking.payments && booking.payments.length > 0) {
      for (const payment of booking.payments) {
        await this.paymentRepo.update(payment.id, { payment_status: PaymentStatus.CANCELLED });
      }
    }

    return { message: 'Booking cancelled' };
  }

  async getTicketById(id: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['user', 'showtime', 'showtime.movie', 'bookingSeats', 'bookingSeats.seat', 'payments'],
    });

    if (!booking) {
      throw new NotFoundException(`Không tìm thấy vé với ID: ${id}`);
    }

    return booking;
  }

  async getAllTickets(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 10));
    const skip = (page - 1) * limit;

    const query = this.bookingRepo.createQueryBuilder('booking');

    query
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.showtime', 'showtime')
      .leftJoinAndSelect('showtime.movie', 'movie')
      .leftJoinAndSelect('booking.bookingSeats', 'bookingSeats')
      .leftJoinAndSelect('bookingSeats.seat', 'seat')
      .leftJoinAndSelect('booking.payments', 'payment');

    if (params?.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.andWhere(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('booking.id = :searchId', { searchId })
              .orWhere('user.email LIKE :search', { search: `%${params.search}%` })
              .orWhere('user.phone LIKE :search', { search: `%${params.search}%` })
              .orWhere('movie.title LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('user.email LIKE :search', { search: `%${params.search}%` })
              .orWhere('user.phone LIKE :search', { search: `%${params.search}%` })
              .orWhere('movie.title LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }

    query.orderBy('booking.created_at', 'DESC');
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createTicket(userId: number, dto: { userId?: number; showtimeId: number; seatIds: number[]; totalPriceMovie: number }) {
    // Xác thực user
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Xác thực showtime
    const showtime = await this.showtimeRepo.findOne({ where: { id: dto.showtimeId } });
    if (!showtime) throw new NotFoundException('Không tìm thấy suất chiếu');
    if (new Date(showtime.startTime) <= new Date()) {
      throw new BadRequestException('Không thể đặt vé cho suất chiếu đã bắt đầu hoặc đã kết thúc');
    }

    // Kiểm tra ghế
    const uniqueSeatIds = Array.from(new Set(dto.seatIds || []));
    if (uniqueSeatIds.length === 0) throw new BadRequestException('Phải chọn ít nhất 1 ghế');
    const seats = await this.seatRepo.find({ where: { id: In(uniqueSeatIds) } });
    if (seats.length !== uniqueSeatIds.length) {
      const foundSeatIds = seats.map((s) => s.id);
      const notFound = uniqueSeatIds.filter((id) => !foundSeatIds.includes(id));
      throw new NotFoundException(`Không tìm thấy các ghế: ${notFound.join(', ')}`);
    }
    const invalidSeats = seats.filter((seat) => seat.screenId !== showtime.screenId);
    if (invalidSeats.length > 0) {
      throw new BadRequestException(
        `Các ghế (ID: ${invalidSeats.map((s) => s.id).join(', ')}) không thuộc phòng chiếu của suất chiếu này`,
      );
    }

    // Ghế đã bị giữ/đặt?
    const activeStatuses = [PaymentStatus.PENDING, PaymentStatus.COMPLETED];
    const conflicts = await this.bookingSeatRepo
      .createQueryBuilder('bookingSeat')
      .innerJoin('bookingSeat.booking', 'booking')
      .leftJoin('booking.payments', 'payment')
      .where('booking.showtimeId = :showtimeId', { showtimeId: dto.showtimeId })
      .andWhere('bookingSeat.seatId IN (:...seatIds)', { seatIds: uniqueSeatIds })
      .andWhere('(payment.id IS NULL OR payment.payment_status IN (:...statuses))', { statuses: activeStatuses })
      .getMany();
    if (conflicts.length > 0) {
      const conflictSeatIds = Array.from(new Set(conflicts.map((c) => c.seatId)));
      throw new BadRequestException(`Các ghế (ID: ${conflictSeatIds.join(', ')}) đã được đặt`);
    }

    // Tạo booking + seats
    const booking = await this.bookingRepo.save({
      userId,
      showtimeId: dto.showtimeId,
      totalSeat: uniqueSeatIds.length,
      totalPriceMovie: dto.totalPriceMovie,
    });
    const bookingSeats = uniqueSeatIds.map((seatId) => ({ bookingId: booking.id, seatId, quantity: 1 }));
    await this.bookingSeatRepo.save(bookingSeats);
    return this.getTicketById(booking.id);
  }

  async updateTicket(id: number, userId: number, dto: { seatIds?: number[]; totalPriceMovie?: number }) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['payments', 'showtime', 'bookingSeats'],
    });

    if (!booking) {
      throw new NotFoundException(`Không tìm thấy vé với ID: ${id}`);
    }

    // Kiểm tra quyền: chỉ chủ vé hoặc admin mới được cập nhật
    if (booking.userId !== userId) {
      throw new BadRequestException('Không phải vé của bạn');
    }

    // Kiểm tra đã thanh toán chưa
    const hasCompletedPayment = booking.payments.some(
      (p) => p.payment_status === PaymentStatus.COMPLETED,
    );
    if (hasCompletedPayment) {
      throw new BadRequestException('Không thể cập nhật vé đã thanh toán thành công');
    }

    // Kiểm tra showtime đã bắt đầu chưa
    if (new Date(booking.showtime.startTime) <= new Date()) {
      throw new BadRequestException('Không thể cập nhật vé sau khi suất chiếu đã bắt đầu');
    }

    // Cập nhật totalPriceMovie nếu có
    if (dto.totalPriceMovie !== undefined) {
      booking.totalPriceMovie = dto.totalPriceMovie;
    }

    // Cập nhật seats nếu có (cần implement logic phức tạp hơn)
    if (dto.seatIds && dto.seatIds.length > 0) {
      const uniqueSeatIds = Array.from(new Set(dto.seatIds));
      if (uniqueSeatIds.length !== dto.seatIds.length) {
        throw new BadRequestException('seatIds không được trùng lặp');
      }

      const seats = await this.seatRepo.find({
        where: { id: In(uniqueSeatIds) },
      });

      if (seats.length !== uniqueSeatIds.length) {
        const foundSeatIds = seats.map((s) => s.id);
        const notFound = uniqueSeatIds.filter((id) => !foundSeatIds.includes(id));
        throw new NotFoundException(`Không tìm thấy các ghế: ${notFound.join(', ')}`);
      }

      const invalidSeats = seats.filter((seat) => seat.screenId !== booking.showtime.screenId);
      if (invalidSeats.length > 0) {
        throw new BadRequestException(
          `Các ghế (ID: ${invalidSeats.map((s) => s.id).join(', ')}) không thuộc phòng chiếu của suất chiếu này`,
        );
      }

      const activeStatuses = [PaymentStatus.PENDING, PaymentStatus.COMPLETED];
      const conflicts = await this.bookingSeatRepo
        .createQueryBuilder('bookingSeat')
        .innerJoin('bookingSeat.booking', 'booking')
        .leftJoin('booking.payments', 'payment')
        .where('booking.showtimeId = :showtimeId', { showtimeId: booking.showtimeId })
        .andWhere('booking.id != :bookingId', { bookingId: booking.id })
        .andWhere('bookingSeat.seatId IN (:...seatIds)', { seatIds: uniqueSeatIds })
        .andWhere(
          '(payment.id IS NULL OR payment.payment_status IN (:...statuses))',
          { statuses: activeStatuses },
        )
        .getMany();

      if (conflicts.length > 0) {
        const conflictSeatIds = Array.from(new Set(conflicts.map((c) => c.seatId)));
        throw new BadRequestException(
          `Các ghế (ID: ${conflictSeatIds.join(', ')}) đã được đặt bởi người khác`,
        );
      }

      // Xóa ghế cũ và thêm ghế mới
      if (booking.bookingSeats && booking.bookingSeats.length > 0) {
        await this.bookingSeatRepo.remove(booking.bookingSeats);
      }

      const newBookingSeats = uniqueSeatIds.map((seatId) =>
        this.bookingSeatRepo.create({ bookingId: booking.id, seatId, quantity: 1 }),
      );
      await this.bookingSeatRepo.save(newBookingSeats);

      booking.totalSeat = uniqueSeatIds.length;
    }

    return this.bookingRepo.save(booking);
  }

  async deleteTicket(id: number, userId: number, isAdmin: boolean = false) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['payments', 'bookingSeats', 'showtime'],
    });

    if (!booking) {
      throw new NotFoundException(`Không tìm thấy vé với ID: ${id}`);
    }

    // Kiểm tra quyền: chỉ chủ vé hoặc admin
    if (!isAdmin && booking.userId !== userId) {
      throw new BadRequestException('Không có quyền xóa vé này');
    }

    // Kiểm tra đã thanh toán chưa
    const hasCompletedPayment = booking.payments.some(
      (p) => p.payment_status === PaymentStatus.COMPLETED,
    );
    if (hasCompletedPayment) {
      throw new BadRequestException('Không thể xóa vé đã thanh toán thành công');
    }

    // Xóa bookingSeats trước
    if (booking.bookingSeats && booking.bookingSeats.length > 0) {
      for (const bookingSeat of booking.bookingSeats) {
        await this.bookingSeatRepo.remove(bookingSeat);
      }
    }

    // Xóa payments
    await this.paymentRepo.delete({ booking: { id } } as any);

    // Xóa booking
    await this.bookingRepo.remove(booking);

    return { message: 'Xóa vé thành công' };
  }
}