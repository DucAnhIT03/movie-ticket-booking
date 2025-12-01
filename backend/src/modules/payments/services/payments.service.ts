import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payment } from 'src/shared/schemas/payment.entity';
import { PaymentStatus, PaymentMethod } from 'src/common/constrants/enums';
import { PaymentRepository } from '../repositories/payment.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { VnpayService } from './vnpay.service';
import { QueueService } from 'src/providers/queue/queue.service';
import { SepayService } from './sepay.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly vnpayService: VnpayService,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
    private readonly sepayService: SepayService,
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
    } else if (payment.payment_method === PaymentMethod.SEAPAY) {
      paymentMethodName = 'Seapay';
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

    
    const orderId = `PAY${paymentId}_${Date.now()}`;
    
    const movieName = ((payment.booking as any).showtime?.movie?.title || 
                     (payment.booking as any).showtime?.movie?.name || 
                     'Vé xem phim')
                     .trim()
                     .substring(0, 80); 
    
   
    const orderInfo = `Thanh toan ve phim: ${movieName}`.substring(0, 100);

   
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

  async initSepayCheckout(
    paymentId: number,
    requesterUserId?: number,
    isAdmin: boolean = false,
  ) {
    if (!this.sepayService.isEnabled()) {
      throw new BadRequestException('SePay chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
    }

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['booking', 'booking.showtime', 'booking.showtime.movie'],
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (!isAdmin && requesterUserId && payment.booking.userId !== requesterUserId) {
      throw new ForbiddenException('Bạn không có quyền khởi tạo thanh toán cho vé này');
    }

    if (payment.payment_method !== PaymentMethod.SEAPAY) {
      throw new BadRequestException('Payment method is not SePay');
    }

    if (payment.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not in PENDING status');
    }

    const amount = Number(payment.amount);
    if (!amount || Number.isNaN(amount)) {
      throw new BadRequestException('Số tiền thanh toán không hợp lệ');
    }

    const currentTransactionId =
      payment.transaction_id && payment.transaction_id.startsWith('SEPAY_')
        ? payment.transaction_id
        : `SEPAY_${payment.id}_${Date.now()}`;

    payment.transaction_id = currentTransactionId;
    await this.paymentRepo.save(payment);

    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const successUrl = `${baseUrl}/api/payments/sepay/return?paymentId=${payment.id}&state=success`;
    const errorUrl = `${baseUrl}/api/payments/sepay/return?paymentId=${payment.id}&state=error`;
    const cancelUrl = `${baseUrl}/api/payments/sepay/return?paymentId=${payment.id}&state=cancel`;

    const customData = {
      paymentId: payment.id,
      bookingId: payment.booking.id,
      successRedirect: `${frontendUrl}/payment-success?paymentId=${payment.id}`,
      failureRedirect: `${frontendUrl}/payment-failure?paymentId=${payment.id}`,
    };

    const checkout = this.sepayService.initOneTimeCheckout({
      orderInvoiceNumber: currentTransactionId,
      amount,
      description: this.buildSepayOrderDescription(payment),
      paymentMethod: 'BANK_TRANSFER',
      currency: 'VND',
      successUrl,
      errorUrl,
      cancelUrl,
      customData: JSON.stringify(customData),
    });

    return {
      paymentId: payment.id,
      checkoutUrl: checkout.checkoutUrl,
      fields: checkout.fields,
    };
  }

  async handleSepayReturn(payload: Record<string, any>) {
    if (!this.sepayService.isEnabled()) {
      throw new BadRequestException('SePay chưa được cấu hình.');
    }

    const normalizedPayload = payload || {};
    const signatureValid = this.sepayService.verifySignature(normalizedPayload);
    if (!signatureValid) {
      throw new BadRequestException('Chữ ký SePay không hợp lệ.');
    }

    const paymentId = this.extractPaymentIdFromSepayPayload(normalizedPayload);
    const orderInvoiceNumber =
      normalizedPayload.order_invoice_number ||
      normalizedPayload.orderInvoiceNumber ||
      normalizedPayload.order_id;

    if (!paymentId && !orderInvoiceNumber) {
      throw new BadRequestException('Thiếu thông tin đơn hàng SePay.');
    }

    let payment: Payment | null = null;
    if (paymentId) {
      payment = await this.paymentRepo.findOne({
        where: { id: Number(paymentId) },
        relations: ['booking'],
      });
    }

    if (!payment && orderInvoiceNumber) {
      payment = await this.paymentRepo.findOne({
        where: { transaction_id: orderInvoiceNumber },
        relations: ['booking'],
      });
    }

    if (!payment) {
      throw new NotFoundException('Không tìm thấy payment để cập nhật trạng thái.');
    }

    const transactionId =
      normalizedPayload.transaction_id ||
      normalizedPayload.transactionId ||
      orderInvoiceNumber ||
      `SEPAY_${Date.now()}`;

    const orderStatus =
      normalizedPayload.order_status ||
      normalizedPayload.orderStatus ||
      normalizedPayload.status ||
      normalizedPayload.state;

    const resultFlag = normalizedPayload.result || normalizedPayload.state;
    const isSuccess = this.isSepaySuccessStatus(orderStatus, resultFlag);

    await this.completePayment(payment.id, transactionId, isSuccess);

    return {
      success: isSuccess,
      paymentId: payment.id,
      orderStatus,
    };
  }

  async getSepayOrderStatus(
    paymentId: number,
    requesterUserId?: number,
    isAdmin: boolean = false,
  ) {
    if (!this.sepayService.isEnabled()) {
      throw new BadRequestException('SePay chưa được cấu hình.');
    }

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['booking'],
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (!isAdmin && requesterUserId && payment.booking.userId !== requesterUserId) {
      throw new ForbiddenException('Bạn không có quyền xem trạng thái thanh toán này');
    }

    if (payment.payment_method !== PaymentMethod.SEAPAY) {
      throw new BadRequestException('Payment method is not SePay');
    }

    if (!payment.transaction_id) {
      throw new BadRequestException('Giao dịch SePay chưa được khởi tạo.');
    }

    try {
      const orderData = await this.sepayService.retrieveOrder(payment.transaction_id);
      const orderStatus =
        orderData?.order_status ||
        orderData?.status ||
        orderData?.transaction_status ||
        orderData?.data?.order_status;

      const success = this.isSepaySuccessStatus(orderStatus);

      if (success && payment.payment_status !== PaymentStatus.COMPLETED) {
        await this.completePayment(payment.id, orderData?.transaction_id || payment.transaction_id, true);
      }

      return {
        paymentStatus: success ? PaymentStatus.COMPLETED : payment.payment_status,
        orderStatus,
        failureReason: success ? undefined : this.buildSepayFailureMessage(orderStatus),
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve SePay order status for payment ${paymentId}`, error as any);
      throw new BadRequestException('Không thể truy vấn trạng thái đơn hàng từ SePay.');
    }
  }

  private buildSepayOrderDescription(payment: Payment): string {
    const movieTitle =
      ((payment.booking as any)?.showtime?.movie?.title ||
        (payment.booking as any)?.showtime?.movie?.name ||
        'Vé xem phim') ?? 'Vé xem phim';
    const trimmedTitle = String(movieTitle).trim();
    return `Thanh toán vé phim: ${trimmedTitle}`.substring(0, 100);
  }

  private extractPaymentIdFromSepayPayload(payload: Record<string, any>): number | null {
    if (!payload) return null;
    const direct =
      payload.payment_id ||
      payload.paymentId ||
      payload.paymentID ||
      payload.paymentid ||
      payload.custom_payment_id;
    if (direct) {
      const parsed = Number(direct);
      return Number.isNaN(parsed) ? null : parsed;
    }

    if (payload.custom_data || payload.customData) {
      try {
        const data = JSON.parse(payload.custom_data || payload.customData);
        if (data?.paymentId) {
          const parsed = Number(data.paymentId);
          return Number.isNaN(parsed) ? null : parsed;
        }
      } catch (error) {
        this.logger.warn('Cannot parse SePay custom_data payload', error as any);
      }
    }

    const queryPayment = payload.paymentId || payload.payment_id;
    if (queryPayment) {
      const parsed = Number(queryPayment);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  private isSepaySuccessStatus(status?: string, fallback?: string): boolean {
    const raw = (status || fallback || '').toString().toUpperCase();
    if (!raw) return false;
    const successFlags = ['SUCCESS', 'SUCCEEDED', 'PAID', 'APPROVED', 'COMPLETED', 'FINISHED'];
    return successFlags.some((flag) => raw.includes(flag));
  }

  private buildSepayFailureMessage(status?: string) {
    if (!status) return undefined;
    const normalized = status.toString().toUpperCase();
    if (normalized.includes('PENDING')) return 'Giao dịch đang chờ xác nhận trên SePay.';
    if (normalized.includes('CANCEL')) return 'Giao dịch đã bị hủy trên SePay.';
    if (normalized.includes('FAIL') || normalized.includes('ERROR')) return 'SePay báo giao dịch thất bại.';
    return undefined;
  }
}