import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Connection, Brackets } from 'typeorm';
import { Booking } from 'src/shared/schemas/booking.entity';
import { Showtime } from 'src/shared/schemas/showtime.entity';
import { Seat } from 'src/shared/schemas/seat.entity';
import { Users } from 'src/shared/schemas/users.entity';
import { CreateBookingDto } from '../dtos/request/create-booking.dto';
import { CancelBookingDto } from '../dtos/request/cancel-booking.dto';
import { AdminFilterBookingDto } from '../dtos/request/admin-filter-booking.dto';
import { FilterBookingDto } from '../dtos/request/filter-booking.dto';
import { BookingSeat } from 'src/shared/schemas/booking-seat.entity';
import { PaymentStatus, SeatTypeEnum } from 'src/common/constrants/enums';
import { Payment } from 'src/shared/schemas/payment.entity';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingSeatRepository } from '../repositories/booking-seat.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { BookingChannel, Roles } from '../../../common/constants/enums';

type BookingStatus = 'BOOKED' | 'PENDING' | 'CANCELLED' | 'FAILED' | null;
import { CreateOfflineBookingDto } from '../dtos/request/create-offline-booking.dto';
import { TicketPricesService } from '../../ticket-prices/services/ticket-prices.service';
import { OfflineBookingQuoteDto } from '../dtos/request/offline-booking-quote.dto';
import { SeatBookingGateway } from '../../seats/gateways/seat-booking.gateway';

@Injectable()
export class BookingsService {

  constructor(
    private connection: Connection,

    private readonly bookingRepo: BookingRepository,

    private readonly bookingSeatRepo: BookingSeatRepository,

    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,

    private readonly paymentRepo: PaymentRepository,

    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,

    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,

    private readonly ticketPricesService: TicketPricesService,
    private readonly seatGateway: SeatBookingGateway,
  ) {}

  private async ensureStaffAccount(staffId: number) {
    if (!staffId) {
      throw new BadRequestException('Không tìm thấy thông tin nhân viên');
    }
    const staffEntity = await this.userRepo.findOne({
      where: { id: staffId },
      relations: ['roles', 'roles.role'],
    });
    if (!staffEntity) {
      throw new NotFoundException('Không tìm thấy tài khoản nhân viên');
    }
    const roleNames = (staffEntity.roles || []).map((ur) => ur.role?.roleName).filter(Boolean);
    const isAllowed =
      roleNames.includes(Roles.ROLE_ADMIN) ||
      roleNames.includes(Roles.ROLE_EMPLOYEE);

    if (!isAllowed) {
      throw new ForbiddenException('Bạn không có quyền xuất vé tại quầy');
    }
    return staffEntity;
  }

  private normalizeTimeString(date: Date) {
    const time = new Date(date);
    return time.toTimeString().slice(0, 8);
  }

  /**
   * Generate unique invoice code for booking
   * Format: HD-YYYYMMDDHHMMSS-XXXXX (HD = Hóa Đơn)
   * Example: HD-20250115143025-00001
   */
  private async generateInvoiceCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const dateTimeStr = `${year}${month}${day}${hours}${minutes}${seconds}`;
    
    // Generate random suffix (5 digits)
    let suffix = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      suffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
      const invoiceCode = `HD-${dateTimeStr}-${suffix}`;
      
      // Check if code already exists
      const existing = await this.bookingRepo.findOne({
        where: { invoiceCode },
      });
      
      if (!existing) {
        isUnique = true;
        return invoiceCode;
      }
      
      attempts++;
    }
    
    // Fallback: use timestamp + random if all attempts failed
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `HD-${dateTimeStr}-${timestamp.toString().slice(-5)}${String(random).padStart(3, '0')}`;
  }

  private async prepareOfflineContext(showtimeId: number, seatIds: number[]) {
    const showtime = await this.showtimeRepo.findOne({
      where: { id: showtimeId },
      relations: ['screen', 'screen.theater', 'movie'],
    });
    if (!showtime) {
      throw new NotFoundException('Không tìm thấy suất chiếu');
    }

    if (new Date(showtime.startTime) <= new Date()) {
      throw new BadRequestException('Không thể xử lý suất chiếu đã bắt đầu hoặc đã kết thúc');
    }

    const seats = await this.seatRepo.find({
      where: { id: In(seatIds) },
      relations: ['screen'],
    });

    if (seats.length !== seatIds.length) {
      const foundSeatIds = seats.map((s) => s.id);
      const notFoundSeats = seatIds.filter((id) => !foundSeatIds.includes(id));
      throw new NotFoundException(`Không tìm thấy các ghế: ${notFoundSeats.join(', ')}`);
    }

    const wrongScreenSeats = seats.filter((seat) => seat.screenId !== showtime.screenId);
    if (wrongScreenSeats.length > 0) {
      throw new BadRequestException(
        `Các ghế (ID: ${wrongScreenSeats.map((s) => s.id).join(', ')}) không thuộc phòng chiếu của suất chiếu này`,
      );
    }

    const bookedSeatIds = await this.getBookedSeats(showtimeId);
    const conflictingSeats = seatIds.filter((id) =>
      bookedSeatIds.includes(id),
    );

    if (conflictingSeats.length > 0) {
      throw new ConflictException(
        `Các ghế (ID: ${conflictingSeats.join(', ')}) đã được đặt.`,
      );
    }

    if (!showtime.movie) {
      throw new NotFoundException('Không tìm thấy thông tin phim của suất chiếu');
    }
    if (!showtime.screen) {
      throw new NotFoundException('Không tìm thấy phòng chiếu của suất chiếu');
    }

    return { showtime, seats };
  }

  private async calculateSeatsPrice(showtime: Showtime, seats: Seat[]) {
    const startTime = new Date(showtime.startTime);
    const timeStr = this.normalizeTimeString(startTime);
    const theaterId = showtime.screen?.theaterId;
    const movieType = showtime.movie?.type;
    const movieId = showtime.movieId;

    if (!movieType) {
      throw new BadRequestException('Phim chưa có loại chiếu (2D/3D)');
    }

    const breakdown: Array<{
      seatId: number;
      seatNumber: string;
      seatType: SeatTypeEnum;
      price: number;
    }> = [];
    for (const seat of seats) {
      const price = await this.ticketPricesService.getPrice(
        seat.type,
        movieType,
        startTime,
        timeStr,
        movieId,
        theaterId,
      );
      if (price === null || price === undefined) {
        throw new BadRequestException(
          `Không tìm thấy giá vé cho ghế ${seat.seatNumber} (${seat.type}). Vui lòng kiểm tra cấu hình giá vé.`,
        );
      }
      breakdown.push({
        seatId: seat.id,
        seatNumber: seat.seatNumber,
        seatType: seat.type,
        price,
      });
    }

    const totalPrice = breakdown.reduce((sum, item) => sum + Number(item.price || 0), 0);
    return { totalPrice, breakdown };
  }

  private resolveBookingStatus(payments: Payment[] | undefined | null): BookingStatus {
    if (!payments || payments.length === 0) {
      return 'PENDING';
    }

    if (payments.some((p) => p.payment_status === PaymentStatus.COMPLETED)) {
      return 'BOOKED';
    }

    if (payments.some((p) => p.payment_status === PaymentStatus.CANCELLED)) {
      return 'CANCELLED';
    }

    if (payments.some((p) => p.payment_status === PaymentStatus.FAILED)) {
      return 'FAILED';
    }

    if (payments.some((p) => p.payment_status === PaymentStatus.PENDING)) {
      return 'PENDING';
    }

    return null;
  }

  private async getBookedSeats(showtimeId: number): Promise<number[]> {
    const bookings = await this.bookingRepo.find({
      where: { showtimeId: showtimeId },
      relations: ['payments'],
    });

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 phút trước

    // Coi ghế là "đã đặt" hoặc "đang được giữ" trong 2 trường hợp:
    // 1. Có payment COMPLETED (đã thanh toán thành công)
    // 2. Có payment PENDING và được tạo trong vòng 5 phút (đang chờ thanh toán)
    const validBookingIds = bookings
      .filter((b) => {
        // Nếu booking không có payment, không coi là đã đặt
        if (!b.payments || b.payments.length === 0) {
          return false;
        }
        
        // Kiểm tra có payment COMPLETED không
        const hasCompleted = b.payments.some(
          (p) => p.payment_status === PaymentStatus.COMPLETED
        );
        if (hasCompleted) {
          return true;
        }

        // Kiểm tra có payment PENDING trong vòng 5 phút không
        const hasPendingPayment = b.payments.some((p) => {
          if (p.payment_status !== PaymentStatus.PENDING) {
            return false;
          }
          // Kiểm tra payment được tạo trong vòng 5 phút
          const paymentCreatedAt = (p as any).created_at || new Date();
          return new Date(paymentCreatedAt) >= fiveMinutesAgo;
        });

        return hasPendingPayment;
      })
      .map((b) => b.id);

    if (validBookingIds.length === 0) {
      return [];
    }

    const bookingSeats = await this.bookingSeatRepo.find({
      where: { bookingId: In(validBookingIds) },
    });

    return bookingSeats.map((bs) => bs.seatId);
  }


  async createBooking(user: any, dto: CreateBookingDto) {
    // Lấy user ID từ JWT token (có thể là user.sub hoặc user.id)
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new BadRequestException('Không tìm thấy thông tin người dùng');
    }

    // Lấy user từ database để đảm bảo user tồn tại
    const userEntity = await this.userRepo.findOne({ where: { id: userId } });
    if (!userEntity) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${userId}`);
    }

    const showtime = await this.showtimeRepo.findOne({
      where: { id: dto.showtimeId },
      relations: ['screen'],
    });
    if (!showtime) {
      throw new NotFoundException('Không tìm thấy suất chiếu');
    }


    // Kiểm tra thời gian: không cho đặt vé online nếu đã qua 10 phút sau thời gian bắt đầu chiếu
    const showtimeStartTime = new Date(showtime.startTime);
    const currentTime = new Date();
    const tenMinutesAfterStart = new Date(showtimeStartTime.getTime() + 10 * 60 * 1000); // Thêm 10 phút
    
    if (currentTime > tenMinutesAfterStart) {
      throw new BadRequestException('Không thể đặt vé online. Suất chiếu đã bắt đầu hơn 10 phút.');
    }
    
    if (currentTime > showtimeStartTime) {
      throw new BadRequestException('Không thể đặt vé cho suất chiếu đã bắt đầu');
    }


    const seats = await this.seatRepo.find({
      where: { id: In(dto.seatIds) },
      relations: ['screen'],
    });

    if (seats.length !== dto.seatIds.length) {
      const foundSeatIds = seats.map((s) => s.id);
      const notFoundSeats = dto.seatIds.filter((id) => !foundSeatIds.includes(id));
      throw new NotFoundException(`Không tìm thấy các ghế: ${notFoundSeats.join(', ')}`);
    }

    // Kiểm tra tất cả ghế có thuộc cùng screen với showtime không
    const wrongScreenSeats = seats.filter((seat) => seat.screenId !== showtime.screenId);
    if (wrongScreenSeats.length > 0) {
      throw new BadRequestException(
        `Các ghế (ID: ${wrongScreenSeats.map((s) => s.id).join(', ')}) không thuộc phòng chiếu của suất chiếu này`,
      );
    }

    // Kiểm tra ghế đã được đặt chưa
    const bookedSeatIds = await this.getBookedSeats(dto.showtimeId);
    const requestedSeats = dto.seatIds;
    const conflictingSeats = requestedSeats.filter((id) =>
      bookedSeatIds.includes(id),
    );

    if (conflictingSeats.length > 0) {
      throw new ConflictException(
        `Các ghế (ID: ${conflictingSeats.join(', ')}) đã được đặt.`,
      );
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceCode = await this.generateInvoiceCode();
      const newBooking = queryRunner.manager.create(Booking, {
        userId: userId,
        showtimeId: dto.showtimeId,
        totalSeat: dto.seatIds.length,
        totalPriceMovie: dto.totalPriceMovie,
        channel: BookingChannel.ONLINE,
        createdByStaffId: null,
        invoiceCode: invoiceCode,
      });
      await queryRunner.manager.save(Booking, newBooking);

      const bookingSeatsData = dto.seatIds.map((seatId) => {
        return queryRunner.manager.create(BookingSeat, {
          bookingId: newBooking.id,
          seatId: seatId,
          quantity: 1,
        });
      });
      await queryRunner.manager.save(BookingSeat, bookingSeatsData);

      if (queryRunner.isTransactionActive) {
        await queryRunner.commitTransaction();
      }

      return newBooking;
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw new BadRequestException('Đặt vé thất bại', err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async createOfflineBooking(staff: any, dto: CreateOfflineBookingDto) {
    const staffId = staff?.id || staff?.sub;
    await this.ensureStaffAccount(staffId);

    let bookingUserId = staffId;
    if (dto.existingUserId) {
      const existingUser = await this.userRepo.findOne({ where: { id: dto.existingUserId } });
      if (!existingUser) {
        throw new NotFoundException('Không tìm thấy khách hàng đã chọn');
      }
      bookingUserId = existingUser.id;
    }

    const { showtime, seats } = await this.prepareOfflineContext(dto.showtimeId, dto.seatIds);
    const pricing = await this.calculateSeatsPrice(showtime, seats);

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceCode = await this.generateInvoiceCode();
      const newBooking = queryRunner.manager.create(Booking, {
        userId: bookingUserId,
        showtimeId: dto.showtimeId,
        totalSeat: dto.seatIds.length,
        totalPriceMovie: pricing.totalPrice,
        channel: BookingChannel.OFFLINE,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        createdByStaffId: staffId,
        invoiceCode: invoiceCode,
      });
      await queryRunner.manager.save(Booking, newBooking);

      const bookingSeatsData = dto.seatIds.map((seatId) => {
        return queryRunner.manager.create(BookingSeat, {
          bookingId: newBooking.id,
          seatId: seatId,
          quantity: 1,
        });
      });
      await queryRunner.manager.save(BookingSeat, bookingSeatsData);

      const payment = queryRunner.manager.create(Payment, {
        booking: newBooking,
        payment_method: dto.paymentMethod,
        payment_status: PaymentStatus.COMPLETED,
        payment_time: new Date(),
        amount: pricing.totalPrice,
      });
      await queryRunner.manager.save(Payment, payment);

      if (queryRunner.isTransactionActive) {
        await queryRunner.commitTransaction();
      }

      const createdBooking = await this.bookingRepo.findOne({
        where: { id: newBooking.id },
        relations: [
          'bookingSeats',
          'bookingSeats.seat',
          'showtime',
          'showtime.movie',
          'showtime.screen',
          'showtime.screen.theater',
        ],
      });

      if (!createdBooking) {
        throw new NotFoundException('Không tìm thấy vé sau khi tạo');
      }

      // Thông báo cập nhật ghế realtime cho suất chiếu này
      await this.seatGateway.broadcastSeatUpdate(
        dto.showtimeId,
        dto.seatIds,
        'BOOKED',
      );

      return {
        booking: createdBooking,
        pricing,
        message: 'Xuất vé tại quầy thành công',
      };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw new BadRequestException('Xuất vé tại quầy thất bại', err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async previewOfflineBooking(staff: any, dto: OfflineBookingQuoteDto) {
    const staffId = staff?.id || staff?.sub;
    await this.ensureStaffAccount(staffId);
    const { showtime, seats } = await this.prepareOfflineContext(dto.showtimeId, dto.seatIds);
    const pricing = await this.calculateSeatsPrice(showtime, seats);
    return {
      showtimeId: showtime.id,
      totalPrice: pricing.totalPrice,
      currency: 'VND',
      seats: pricing.breakdown,
    };
  }

  async deleteBooking(bookingId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['payments', 'showtime', 'bookingSeats'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy vé');
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Xóa booking seats
      if (booking.bookingSeats && booking.bookingSeats.length > 0) {
        await queryRunner.manager.delete(BookingSeat, { bookingId: booking.id });
      }

      // Cập nhật payment status thành CANCELLED nếu có
      if (booking.payments && booking.payments.length > 0) {
        await queryRunner.manager.update(
          Payment,
          { booking: { id: booking.id } },
          { payment_status: PaymentStatus.CANCELLED },
        );
      }

      const seatIds =
        booking.bookingSeats?.map((bs) => bs.seatId).filter(Boolean) || [];

      // Xóa booking
      await queryRunner.manager.delete(Booking, { id: booking.id });

      if (queryRunner.isTransactionActive) {
        await queryRunner.commitTransaction();
      }

      // Thông báo cập nhật ghế realtime cho suất chiếu liên quan
      if (booking.showtimeId && seatIds.length > 0) {
        await this.seatGateway.broadcastSeatUpdate(
          booking.showtimeId,
          seatIds,
          'RELEASED',
        );
      }

      return { message: 'Xóa vé thành công' };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw new BadRequestException('Xóa vé thất bại', err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async cancelBooking(userId: number, dto: CancelBookingDto) {
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
      relations: ['payments', 'showtime', 'user', 'bookingSeats'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy vé');
    }
    if (booking.userId !== userId) {
      throw new BadRequestException('Không phải vé của bạn');
    }

    const hasCompletedPayment = booking.payments.some(
      (p) => p.payment_status === PaymentStatus.COMPLETED,
    );
    if (hasCompletedPayment) {
      throw new BadRequestException('Không thể hủy vé đã thanh toán thành công.');
    }

    if (new Date(booking.showtime.startTime) <= new Date()) {
      throw new BadRequestException(
        'Không thể hủy vé sau khi suất chiếu đã bắt đầu',
      );
    }

    const seatIds =
      booking.bookingSeats?.map((bs) => bs.seatId).filter(Boolean) || [];

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(BookingSeat, { bookingId: booking.id });

      await queryRunner.manager.update(
        Payment,
        { booking: { id: booking.id } },
        { payment_status: PaymentStatus.CANCELLED },
      );

      await queryRunner.manager.delete(Booking, { id: booking.id });

      if (queryRunner.isTransactionActive) {
        await queryRunner.commitTransaction();
      }

      // Thông báo cập nhật ghế realtime cho suất chiếu liên quan
      if (booking.showtimeId && seatIds.length > 0) {
        await this.seatGateway.broadcastSeatUpdate(
          booking.showtimeId,
          seatIds,
          'RELEASED',
        );
      }

      return { message: 'Hủy vé thành công' };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw new BadRequestException('Hủy vé thất bại', err.message);
    } finally {
      await queryRunner.release();
    }
  }


  async findAdminBookings(filter: AdminFilterBookingDto) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;
    const { q, status, channel, startDate, endDate } = filter;

    const skip = (page - 1) * limit; 

    const query = this.bookingRepo.createQueryBuilder('booking');

    query
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.showtime', 'showtime')
      .leftJoinAndSelect('showtime.movie', 'movie')
      .leftJoinAndSelect('booking.payments', 'payment')
      .leftJoinAndSelect('booking.createdByStaff', 'createdByStaff');

    if (q) {
      const trimmedQ = q.trim();
      const qId = Number(trimmedQ);
      const isValidId = !isNaN(qId) && qId > 0;
      const qLike = `%${trimmedQ.toLowerCase()}%`;
      
      query.andWhere(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('booking.id = :qId', { qId })
              .orWhere('LOWER(booking.invoiceCode) LIKE :q', { q: qLike })
              .orWhere('LOWER(user.email) LIKE :q', { q: qLike })
              .orWhere('LOWER(movie.title) LIKE :q', { q: qLike })
              .orWhere('booking.customerPhone LIKE :phone', { phone: `%${trimmedQ}%` })
              .orWhere('user.phone LIKE :phone', { phone: `%${trimmedQ}%` });
          } else {
            qb.where('LOWER(booking.invoiceCode) LIKE :q', { q: qLike })
              .orWhere('LOWER(user.email) LIKE :q', { q: qLike })
              .orWhere('LOWER(movie.title) LIKE :q', { q: qLike })
              .orWhere('booking.customerPhone LIKE :phone', { phone: `%${trimmedQ}%` })
              .orWhere('user.phone LIKE :phone', { phone: `%${trimmedQ}%` });
          }
        }),
      );
    }

    if (status) {
      if (status === 'BOOKED') {
       
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.COMPLETED },
        );
      } else if (status === 'PENDING') {
        
        query.andWhere(
          new Brackets((qb) => {
            qb.where(
              'NOT EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id)',
            )
              .orWhere(
                '(EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :pendingStatus) AND NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus))',
                {
                  pendingStatus: PaymentStatus.PENDING,
                  completedStatus: PaymentStatus.COMPLETED,
                },
              );
          }),
        );
      } else if (status === 'CANCELLED') {
    
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.CANCELLED },
        );
        query.andWhere(
          'NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus)',
          { completedStatus: PaymentStatus.COMPLETED },
        );
      } else if (status === 'FAILED') {
        // FAILED = có payment với status FAILED và không có COMPLETED
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.FAILED },
        );
        query.andWhere(
          'NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus)',
          { completedStatus: PaymentStatus.COMPLETED },
        );
      }
    }

    if (channel) {
      query.andWhere('booking.channel = :channel', { channel });
    }

    // Lọc theo ngày tạo
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        query.andWhere('booking.created_at >= :startDate', { startDate: start });
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        // Lấy hết ngày (23:59:59.999)
        end.setHours(23, 59, 59, 999);
        query.andWhere('booking.created_at <= :endDate', { endDate: end });
      }
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

 
  async findAll(userId: number, filter: FilterBookingDto) {
    const { status, page, limit } = filter;

    
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Optimize: Only select user phone, not entire user entity
    const user = await this.userRepo.findOne({ 
      where: { id: userId },
      select: ['id', 'phone'] // Only select needed fields
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    const userPhone = (user as any).phone ? String((user as any).phone).trim() : null;

    const query = this.bookingRepo.createQueryBuilder('booking');

    // Optimize: Reduce N+1 queries and unnecessary relations
    // Strategy: Only load relations that are actually needed, use leftJoin for optional data
    query
      // Essential relations - load full entities for core data
      .leftJoinAndSelect('booking.showtime', 'showtime')
      .leftJoinAndSelect('showtime.movie', 'movie')
      .leftJoinAndSelect('showtime.screen', 'screen')
      // Payments - needed for status resolution (only payment_status is critical)
      .leftJoinAndSelect('booking.payments', 'payment')
      // BookingSeats - needed for seat information
      .leftJoinAndSelect('booking.bookingSeats', 'bookingSeats')
      // Optional relations - use leftJoin (not leftJoinAndSelect) to avoid loading unless needed
      .leftJoin('screen.theater', 'theater') // Theater name can be lazy loaded if needed
      .leftJoin('bookingSeats.seat', 'seat'); // Seat details can be lazy loaded
    
    // Select only necessary fields from optional joins to reduce payload size
    // This prevents loading entire theater/seat entities when only name/number is needed
    query.addSelect([
      'theater.id',
      'theater.name',
      'seat.id',
      'seat.seatNumber',
      'seat.type', // Note: field name is 'type', not 'seatType' (see Seat entity)
    ]);

    query.where(
      new Brackets((qb) => {
        qb.where('(booking.userId = :userId AND booking.channel = :onlineChannel)', {
          userId,
          onlineChannel: BookingChannel.ONLINE,
        });

        if (userPhone) {
          qb.orWhere('(booking.channel = :offlineChannel AND booking.customerPhone = :phone)', {
            offlineChannel: BookingChannel.OFFLINE,
            phone: userPhone,
          });
        }
      }),
    );

    if (status) {
      if (status === 'BOOKED') {
        // BOOKED = có payment với status COMPLETED
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.COMPLETED },
        );
      } else if (status === 'PENDING') {
        // PENDING = không có payment HOẶC có payment với status PENDING (và không có COMPLETED)
        query.andWhere(
          new Brackets((qb) => {
            qb.where(
              'NOT EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id)',
            )
              .orWhere(
                '(EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :pendingStatus) AND NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus))',
                {
                  pendingStatus: PaymentStatus.PENDING,
                  completedStatus: PaymentStatus.COMPLETED,
                },
              );
          }),
        );
      } else if (status === 'CANCELLED') {
        // CANCELLED = có payment với status CANCELLED và không có COMPLETED
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.CANCELLED },
        );
        query.andWhere(
          'NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus)',
          { completedStatus: PaymentStatus.COMPLETED },
        );
      } else if (status === 'FAILED') {
        // FAILED = có payment với status FAILED và không có COMPLETED
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.FAILED },
        );
        query.andWhere(
          'NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus)',
          { completedStatus: PaymentStatus.COMPLETED },
        );
      }
    }

    query.orderBy('booking.created_at', 'DESC');
    query.skip(skip).take(limitNum);

    const [items, total] = await query.getManyAndCount();

    const itemsWithStatus = items.map((booking) => {
      (booking as any).status = this.resolveBookingStatus(booking.payments);
      return booking;
    });

    return {
      items: itemsWithStatus,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
