import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat } from '../../../shared/schemas/seat.entity';
import { Screen } from '../../../shared/schemas/screen.entity';
import { Showtime } from '../../../shared/schemas/showtime.entity';
import { Booking } from '../../../shared/schemas/booking.entity';
import { BookingSeat } from '../../../shared/schemas/booking-seat.entity';
import { SeatRepository } from '../repositories/seat.repository';
import { SeatTypeEnum } from '../../../common/constrants/enums';

@Injectable()
export class SeatsService {
  constructor(
    private readonly seatRepository: SeatRepository,
    @InjectRepository(Screen)
    private readonly screenRepository: Repository<Screen>,
    @InjectRepository(Showtime)
    private readonly showtimeRepository: Repository<Showtime>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingSeat)
    private readonly bookingSeatRepository: Repository<BookingSeat>,
  ) {}

  async findAll(): Promise<Seat[]> {
    return this.seatRepository.find({ 
      relations: ['screen'],
      order: { seatNumber: 'ASC' }
    });
  }

  async findByScreen(screenId: number): Promise<Seat[]> {
    const screen = await this.screenRepository.findOne({ 
      where: { id: screenId } 
    });
    if (!screen) {
      throw new NotFoundException(`Không tìm thấy phòng chiếu với ID: ${screenId}`);
    }
    
    return this.seatRepository.find({ 
      where: { screenId },
      relations: ['screen', 'bookingSeats'],
      order: { seatNumber: 'ASC' }
    });
  }

  async create(seatData: Partial<Seat>): Promise<Seat> {
    // Mặc định type là STANDARD nếu không có
    if (!seatData.type) {
      seatData.type = SeatTypeEnum.STANDARD;
    }
 
    if (seatData.screenId) {
      const screen = await this.screenRepository.findOne({ 
        where: { id: seatData.screenId } 
      });
      if (!screen) {
        throw new NotFoundException(`Không tìm thấy phòng chiếu với ID: ${seatData.screenId}`);
      }
    }

    
    if (seatData.seatNumber && seatData.screenId) {
      const existing = await this.seatRepository.findOne({
        where: {
          seatNumber: seatData.seatNumber,
          screenId: seatData.screenId,
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Ghế ${seatData.seatNumber} đã tồn tại trong phòng chiếu này`,
        );
      }
    }

    const seat = this.seatRepository.create(seatData);
    return this.seatRepository.save(seat);
  }

  async findOne(id: number): Promise<Seat> {
    const seat = await this.seatRepository.findOne({ 
      where: { id },
      relations: ['screen', 'bookingSeats']
    });
    if (!seat) {
      throw new NotFoundException(`Không tìm thấy ghế với ID: ${id}`);
    }
    return seat;
  }

  async update(id: number, seatData: Partial<Seat>): Promise<Seat> {
    const seat = await this.findOne(id);

    
    if (seatData.screenId && seatData.screenId !== seat.screenId) {
      const screen = await this.screenRepository.findOne({ 
        where: { id: seatData.screenId } 
      });
      if (!screen) {
        throw new NotFoundException(`Không tìm thấy phòng chiếu với ID: ${seatData.screenId}`);
      }
    }

    
    if (seatData.seatNumber && seatData.seatNumber !== seat.seatNumber) {
      const screenId = seatData.screenId || seat.screenId;
      const existing = await this.seatRepository.findOne({
        where: {
          seatNumber: seatData.seatNumber,
          screenId: screenId,
        },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Ghế ${seatData.seatNumber} đã tồn tại trong phòng chiếu này`,
        );
      }
    }

    Object.assign(seat, seatData);
    return this.seatRepository.save(seat);
  }

  async remove(id: number): Promise<{ message: string }> {
    const seat = await this.findOne(id);

   
    if (seat.bookingSeats && seat.bookingSeats.length > 0) {
      throw new BadRequestException(
        'Không thể xóa ghế đã được đặt. Vui lòng xóa các đặt vé liên quan trước.',
      );
    }

    await this.seatRepository.remove(seat);
    return { message: 'Ghế đã được xóa thành công' };
  }

  /**
   * Lấy sơ đồ ghế theo showtime với trạng thái đặt
   * @param showtimeId ID của suất chiếu
   * @returns Danh sách ghế kèm trạng thái đã đặt
   */
  async findByShowtime(showtimeId: number): Promise<Array<Seat & { isBooked: boolean }>> {
    // Kiểm tra showtime có tồn tại không
    const showtime = await this.showtimeRepository.findOne({
      where: { id: showtimeId },
      relations: ['screen'],
    });

    if (!showtime) {
      throw new NotFoundException(`Không tìm thấy suất chiếu với ID: ${showtimeId}`);
    }

    // Lấy tất cả ghế của phòng chiếu
    const seats = await this.seatRepository.find({
      where: { screenId: showtime.screenId },
      order: { seatNumber: 'ASC' },
    });

    // Lấy danh sách ghế đã được đặt trong suất chiếu này
    // Chỉ lấy ghế có payment status là COMPLETED (đã thanh toán)
    const bookedSeats = await this.bookingSeatRepository
      .createQueryBuilder('bs')
      .innerJoin('bs.booking', 'booking')
      .leftJoin('booking.payments', 'payment')
      .where('booking.showtimeId = :showtimeId', { showtimeId })
      .andWhere('payment.payment_status = :status', { status: 'COMPLETED' })
      .select('bs.seatId', 'seatId')
      .distinct(true)
      .getRawMany();

    const bookedSeatIds = new Set(bookedSeats.map((bs: any) => bs.seatId));

    // Gán trạng thái đặt cho từng ghế
    return seats.map((seat) => ({
      ...seat,
      isBooked: bookedSeatIds.has(seat.id),
    }));
  }

  /**
   * Lấy sơ đồ ghế theo screen với trạng thái đặt (nếu có showtimeId)
   * @param screenId ID của phòng chiếu
   * @param showtimeId ID của suất chiếu (optional)
   * @returns Danh sách ghế kèm trạng thái đã đặt
   */
  async findByScreenWithBookingStatus(
    screenId: number,
    showtimeId?: number,
  ): Promise<Array<Seat & { isBooked: boolean }>> {
    const screen = await this.screenRepository.findOne({
      where: { id: screenId },
    });

    if (!screen) {
      throw new NotFoundException(`Không tìm thấy phòng chiếu với ID: ${screenId}`);
    }

    // Lấy tất cả ghế của phòng chiếu
    const seats = await this.seatRepository.find({
      where: { screenId },
      order: { seatNumber: 'ASC' },
    });

    // Nếu có showtimeId, kiểm tra ghế đã đặt
    if (showtimeId) {
      // Chỉ lấy ghế có payment status là COMPLETED (đã thanh toán)
      const bookedSeats = await this.bookingSeatRepository
        .createQueryBuilder('bs')
        .innerJoin('bs.booking', 'booking')
        .leftJoin('booking.payments', 'payment')
        .where('booking.showtimeId = :showtimeId', { showtimeId })
        .andWhere('payment.payment_status = :status', { status: 'COMPLETED' })
        .select('bs.seatId', 'seatId')
        .distinct(true)
        .getRawMany();

      const bookedSeatIds = new Set(bookedSeats.map((bs: any) => bs.seatId));

      return seats.map((seat) => ({
        ...seat,
        isBooked: bookedSeatIds.has(seat.id),
      }));
    }

    // Nếu không có showtimeId, tất cả ghế đều chưa đặt
    return seats.map((seat) => ({
      ...seat,
      isBooked: false,
    }));
  }
}
