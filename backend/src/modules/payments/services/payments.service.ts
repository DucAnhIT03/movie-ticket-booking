import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { Payment } from 'src/shared/schemas/payment.entity';
import { PaymentStatus, PaymentMethod } from 'src/common/constrants/enums';
import { PaymentRepository } from '../repositories/payment.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { VnpayService } from './vnpay.service';
import { QueueService } from 'src/providers/queue/queue.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly vnpayService: VnpayService,
    private readonly queueService: QueueService,
  ) {}

  async createPayment(bookingId: number, method: PaymentMethod, amount: number, requesterUserId?: number, isAdmin: boolean = false, promotionId?: number) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId }, relations: ['payments', 'showtime'] });
    if (!booking) throw new NotFoundException('Booking not found');

    if (!isAdmin && requesterUserId && booking.userId !== requesterUserId) {
      throw new ForbiddenException('Bạn không có quyền tạo thanh toán cho vé này');
    }

    if (new Date((booking as any).showtime.startTime) <= new Date()) {
      throw new BadRequestException('Suất chiếu đã bắt đầu hoặc kết thúc');
    }

    const hasCompleted = ((booking as any).payments || []).some((p: any) => p.payment_status === PaymentStatus.COMPLETED);
    if (hasCompleted) {
      throw new BadRequestException('Vé đã được thanh toán thành công');
    }

    // Nếu có promotion, không cần kiểm tra amount khớp với totalPriceMovie
    // vì amount đã được tính sau khi áp dụng discount
    if (!promotionId && typeof amount === 'number' && amount !== Number(booking.totalPriceMovie)) {
      throw new BadRequestException('Số tiền thanh toán không khớp với tổng vé');
    }

    const paymentData: any = {
      booking,
      payment_method: method,
      payment_status: PaymentStatus.PENDING,
      amount,
    };

    // Thêm promotionId nếu có
    if (promotionId) {
      paymentData.promotionId = promotionId;
    }

    const payment = this.paymentRepo.create(paymentData);

    return this.paymentRepo.save(payment);
  }

  async completePayment(
    paymentId: number,
    transactionId: string,
    success = true,
  ) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['booking'],
    });

    if (!payment) throw new NotFoundException('Payment not found');

    // Kiểm tra nếu payment đã completed rồi thì không update nữa (tránh duplicate)
    const wasAlreadyCompleted = payment.payment_status === PaymentStatus.COMPLETED;
    if (wasAlreadyCompleted && success) {
      this.logger.warn(`Payment ${paymentId} already completed, skipping update`);
      return payment;
    }

    // Nếu đang failed và nhận được success, vẫn cho phép update (có thể là retry)
    // Nhưng nếu đã completed thì không update nữa

    payment.transaction_id = transactionId;
    payment.payment_status = success
      ? PaymentStatus.COMPLETED
      : PaymentStatus.FAILED;
    (payment as any).payment_time = new Date();

    await this.paymentRepo.save(payment);

    // Gửi email khi thanh toán thành công (chỉ gửi 1 lần khi chuyển sang COMPLETED từ trạng thái khác)
    if (success && !wasAlreadyCompleted) {
      try {
        await this.sendPaymentSuccessEmail(payment);
      } catch (error) {
        this.logger.error(`Failed to send payment success email for payment ${paymentId}:`, error);
        // Không throw error để không ảnh hưởng đến quá trình thanh toán
      }
    }

    return payment;
  }

  private async sendPaymentSuccessEmail(payment: Payment) {
    // Lấy đầy đủ thông tin booking với các relations cần thiết
    const bookingId = (payment.booking as any)?.id || payment.booking?.id;
    if (!bookingId) {
      this.logger.warn(`Cannot send email: missing booking ID for payment ${payment.id}`);
      return;
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: [
        'user',
        'showtime',
        'showtime.movie',
        'showtime.screen',
        'showtime.screen.theater',
        'bookingSeats',
        'bookingSeats.seat',
      ],
    });

    if (!booking || !booking.user || !booking.showtime) {
      this.logger.warn(`Cannot send email: missing booking data for payment ${payment.id}`);
      return;
    }

    const user = booking.user;
    const showtime = booking.showtime;
    const movie = showtime.movie;
    const screen = (showtime as any).screen;
    const theater = screen?.theater;

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Khách hàng';
    const movieTitle = movie?.title || 'N/A';
    const theaterName = theater?.name || 'N/A';
    const screenName = screen?.name || 'N/A';
    const seats = booking.bookingSeats
      ?.map((bs) => bs.seat?.seatNumber || '')
      .filter(Boolean) || [];

    // Xác định phương thức thanh toán
    let paymentMethodName = 'Khác';
    if (payment.payment_method === PaymentMethod.VNPAY) {
      paymentMethodName = 'VNPAY';
    } else if (payment.payment_method === PaymentMethod.VIETQR) {
      paymentMethodName = 'VietQR';
    } else if (payment.payment_method === PaymentMethod.VIETTEL_PAY) {
      paymentMethodName = 'ViettelPay';
    } else if (payment.payment_method === PaymentMethod.PAYPAL) {
      paymentMethodName = 'PayPal';
    }

    // Gửi email hóa đơn với thông tin đầy đủ
    await this.queueService.enqueueBookingInvoiceEmail({
      to: user.email,
      userName: userName,
      bookingId: booking.id,
      movieTitle: movieTitle,
      theaterName: theaterName,
      screenName: screenName,
      showTime: showtime.startTime,
      seats: seats,
      totalPrice: booking.totalPriceMovie,
      bookingDate: booking.created_at || new Date(),
      invoiceNumber: `INV-${payment.id}-${Date.now()}`,
      paymentMethod: paymentMethodName,
      paymentStatus: 'COMPLETED',
      transactionId: payment.transaction_id || '',
      paymentDate: payment.payment_time || new Date(),
    });

    this.logger.log(`Payment success email queued for booking ${booking.id}, payment ${payment.id}`);
  }

  async getPayment(id: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['booking', 'booking.user', 'booking.showtime', 'booking.bookingSeats'],
    });

    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  /**
   * Tạo VNPAY payment URL
   */
  async createVnpayPaymentUrl(
    paymentId: number,
    returnUrl: string,
    ipAddr: string,
    requesterUserId?: number,
    isAdmin: boolean = false,
  ): Promise<string> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['booking', 'booking.showtime', 'booking.showtime.movie'],
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (!isAdmin && requesterUserId && payment.booking.userId !== requesterUserId) {
      throw new ForbiddenException('Bạn không có quyền tạo thanh toán cho vé này');
    }

    if (payment.payment_method !== PaymentMethod.VNPAY) {
      throw new BadRequestException('Payment method is not VNPAY');
    }

    if (payment.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not in PENDING status');
    }

    // Tạo order ID từ payment ID và timestamp
    const orderId = `PAY${paymentId}_${Date.now()}`;
    
    // Tạo order info - VNPAY yêu cầu orderInfo tối đa 100 ký tự
    // Loại bỏ các ký tự đặc biệt có thể gây lỗi, giữ lại tiếng Việt có dấu (sẽ được encode tự động)
    const movieName = ((payment.booking as any).showtime?.movie?.title || 
                     (payment.booking as any).showtime?.movie?.name || 
                     'Vé xem phim')
                     .trim()
                     .substring(0, 80); // Giữ lại 80 ký tự cho tên phim, 20 ký tự cho prefix
    
    // Tạo orderInfo với format đơn giản, tránh ký tự đặc biệt
    const orderInfo = `Thanh toan ve phim: ${movieName}`.substring(0, 100);

    // Tạo VNPAY payment URL
    try {
      const paymentUrl = this.vnpayService.createPaymentUrl({
        amount: Number(payment.amount),
        orderId,
        orderInfo,
        returnUrl,
        ipAddr,
        locale: 'vn',
      });

      this.logger.log(`VNPAY payment URL created for payment ${paymentId}: ${orderId}`);
      return paymentUrl;
    } catch (error) {
      this.logger.error(`Failed to create VNPAY payment URL for payment ${paymentId}:`, error);
      throw error;
    }
  }
}