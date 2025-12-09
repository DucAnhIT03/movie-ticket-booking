import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payment } from 'src/shared/schemas/payment.entity';
import { PaymentStatus, PaymentMethod } from 'src/common/constrants/enums';
import { PaymentRepository } from '../repositories/payment.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { VnpayService } from './vnpay.service';
import { QueueService } from 'src/providers/queue/queue.service';
import { SepayService } from './sepay.service';
import { MomoService } from './momo.service';
import { SeatBookingGateway } from '../../seats/gateways/seat-booking.gateway';

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
    private readonly momoService: MomoService,
    private readonly seatGateway: SeatBookingGateway,
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
    this.logger.log(
      `[PAYMENT] completePayment start id=${paymentId}, tx=${transactionId}, success=${success}`,
    );
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: [
        'booking',
        'booking.showtime',
        'booking.bookingSeats',
        'booking.bookingSeats.seat',
      ],
    });

    // Fallback if not found by id: try transaction_id matches provided transactionId/orderId
    if (!payment && transactionId) {
      this.logger.warn(
        `[PAYMENT] Payment id=${paymentId} not found by id, try lookup by transaction_id=${transactionId}`,
      );
      const byTx = await this.paymentRepo.findOne({
        where: { transaction_id: transactionId },
        relations: [
          'booking',
          'booking.showtime',
          'booking.bookingSeats',
          'booking.bookingSeats.seat',
        ],
      });
      if (byTx) {
        paymentId = byTx.id;
        return this.completePayment(paymentId, transactionId, success);
      }
    }

    if (!payment) throw new NotFoundException('Payment not found');

    const bookingSeatsCount = (payment.booking as any)?.bookingSeats?.length || 0;
    const bookingShowtimeId =
      (payment.booking as any)?.showtimeId || (payment.booking as any)?.showtime?.id;

    this.logger.debug(
      `[PAYMENT] Fetch payment ${paymentId}: status=${payment.payment_status}, bookingId=${(payment.booking as any)?.id}, showtimeId=${bookingShowtimeId}, seats=${bookingSeatsCount}`,
    );

    const wasAlreadyCompleted = payment.payment_status === PaymentStatus.COMPLETED;
    if (wasAlreadyCompleted && success) {
      this.logger.warn(`Payment ${paymentId} already completed, ensuring broadcast only`);
      await this.safeBroadcastSeatUpdate(paymentId, payment.booking);
      return payment;
    }

    payment.transaction_id = transactionId;
    payment.payment_status = success
      ? PaymentStatus.COMPLETED
      : PaymentStatus.FAILED;
    (payment as any).payment_time = new Date();

    await this.paymentRepo.save(payment);

    this.logger.debug(
      `[PAYMENT] Saved payment ${paymentId} -> status=${payment.payment_status}, success=${success}`,
    );

    if (success && !wasAlreadyCompleted) {
      // always try to send email but never block seat updates
      try {
        await this.sendPaymentSuccessEmail(payment);
      } catch (error) {
        this.logger.error(`Failed to send payment success email for ${paymentId}:`, error);
      }

      await this.safeBroadcastSeatUpdate(paymentId, payment.booking);
    }

    return payment;
  }

  private async safeBroadcastSeatUpdate(paymentId: number, booking: any) {
    try {
      const seatIds =
        booking?.bookingSeats
          ?.map((bs: any) => bs.seat?.id || bs.seatId)
          .filter(Boolean) || [];
      const showtimeId = booking?.showtimeId || booking?.showtime?.id;

      this.logger.debug(
        `[PAYMENT] Broadcast seat update payment=${paymentId} -> showtime=${showtimeId}, seats=${seatIds.join(',')}`,
      );

      if (showtimeId && seatIds.length > 0) {
        await this.seatGateway.broadcastSeatUpdate(showtimeId, seatIds, 'BOOKED');
      } else {
        this.logger.warn(
          `[PAYMENT] Missing showtime or seats on broadcast paymentId=${paymentId}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to broadcast seat update for payment ${paymentId}:`, error);
    }
  }

  private async sendPaymentSuccessEmail(payment: Payment) {
   
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

    // Xác định phương thức thanh toán hiển thị ra email hóa đơn
    const paymentMethodName = (() => {
      switch (payment.payment_method) {
        case PaymentMethod.VNPAY:
          return 'VNPAY';
        case PaymentMethod.VIETQR:
          return 'VietQR';
        case PaymentMethod.VIETTEL_PAY:
          return 'ViettelPay';
        case PaymentMethod.SEAPAY:
          return 'Seapay';
        case PaymentMethod.PAYPAL:
          return 'PayPal';
        case PaymentMethod.MOMO:
          return 'MoMo';
        case PaymentMethod.POS:
          return 'POS (quầy)';
        case PaymentMethod.CASH:
          return 'Tiền mặt';
        default:
          return 'Khác';
      }
    })();

    // Gửi email hóa đơn với thông tin đầy đủ
    await this.queueService.enqueueBookingInvoiceEmail({
      to: user.email,
      subject: `Hóa đơn thanh toán vé #${booking.id} - ${movieTitle}`,
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

    
    const orderId = `PAY${paymentId}_BK${(payment.booking as any)?.id}_PND${Date.now()}`;
    
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

  async createMomoPaymentUrl(
    paymentId: number,
    returnUrl: string,
    ipnUrl?: string,
    requesterUserId?: number,
    isAdmin: boolean = false,
  ) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['booking', 'booking.showtime', 'booking.showtime.movie'],
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (!isAdmin && requesterUserId && payment.booking.userId !== requesterUserId) {
      throw new ForbiddenException('Bạn không có quyền tạo thanh toán cho vé này');
    }

    if (payment.payment_method !== PaymentMethod.MOMO && payment.payment_method !== PaymentMethod.POS) {
      throw new BadRequestException('Payment method is not MOMO');
    }

    if (payment.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not in PENDING status');
    }

    const orderId = `PAY${paymentId}_${Date.now()}`;
    const movieName = ((payment.booking as any).showtime?.movie?.title || 'Vé xem phim').trim().substring(0, 80);
    const orderInfo = `Thanh toán MoMo: ${movieName}`.substring(0, 90);
    const extraData = Buffer.from(
      JSON.stringify({
        paymentId,
        bookingId: (payment.booking as any)?.id,
      }),
    ).toString('base64');

    const effectiveIpnUrl = ipnUrl || returnUrl;
    this.logger.log(
      `[MOMO] Creating payment: paymentId=${paymentId}, orderId=${orderId}, returnUrl=${returnUrl}, ipnUrl=${effectiveIpnUrl}`,
    );

    // Lưu tạm orderId vào transaction_id để tra cứu fallback nếu IPN về mà không parse được id
    if (!payment.transaction_id) {
      payment.transaction_id = orderId;
      await this.paymentRepo.save(payment);
    }

    const amountNumber = Math.round(Number(payment.amount || 0));
    // MoMo yêu cầu 1,000 <= amount <= 50,000,000
    if (amountNumber < 1000 || amountNumber > 50_000_000) {
      throw new BadRequestException('Số tiền thanh toán phải trong khoảng 1.000 - 50.000.000 VND để thanh toán MoMo');
    }

    // Dùng payWithMethod để MoMo hiển thị lựa chọn ví/ATM/thẻ
    const response = await this.momoService.createPayment({
      amount: amountNumber,
      orderId,
      orderInfo,
      returnUrl,
      ipnUrl: effectiveIpnUrl,
      requestType: 'payWithMethod',
      extraData,
    });

    if (response.resultCode !== 0) {
      this.logger.error(`MoMo create payment failed for ${paymentId}: ${JSON.stringify(response)}`);
      throw new BadRequestException('Không thể tạo liên kết thanh toán MoMo');
    }

    return {
      payUrl: response.payUrl,
      deeplink: response.deeplink,
      qrCodeUrl: response.qrCodeUrl,
      paymentId,
      orderId,
    };
  }

  async handleMomoIpn(payload: any) {
    const signatureValid = this.momoService.verifySignature(payload);
    if (!signatureValid) {
      this.logger.warn(`[MOMO][IPN] Invalid signature for orderId=${payload?.orderId}`);
      throw new BadRequestException('Chữ ký MoMo không hợp lệ');
    }

    // orderId format: PAY{paymentId}_BK{bookingId}_{timestamp}
    const orderId = payload?.orderId as string;
    const matched = orderId?.match(/^PAY(\d+)_BK(\d+)_PND/);
    let paymentId = matched ? Number(matched[1]) : null;
    let bookingIdFromOrder: number | null = matched && matched[2] ? Number(matched[2]) : null;

    let bookingIdFromExtra: number | null = bookingIdFromOrder;
    // Fallback: lấy paymentId/bookingId từ extraData nếu orderId không parse được
    if (payload?.extraData) {
      try {
        const decodedExtra = Buffer.from(payload.extraData, 'base64').toString('utf8');
        const parsedExtra = JSON.parse(decodedExtra);
        if (!paymentId && parsedExtra?.paymentId) {
          paymentId = Number(parsedExtra.paymentId);
        }
        if (parsedExtra?.bookingId) {
          bookingIdFromExtra = Number(parsedExtra.bookingId);
        }
      } catch (err) {
        this.logger.warn(`[MOMO] Không thể parse extraData cho orderId=${orderId}: ${err?.message}`);
      }
    }

    if (!paymentId) {
      throw new BadRequestException('orderId hoặc extraData không hợp lệ');
    }

    const success = Number(payload?.resultCode) === 0;
    const transactionId = payload?.transId?.toString() || orderId;

    this.logger.log(
      `[MOMO][IPN] Received: orderId=${orderId}, paymentId=${paymentId}, bookingId=${bookingIdFromExtra}, resultCode=${payload?.resultCode}, transId=${transactionId}, amount=${payload?.amount}`,
    );

    // Resolve payment record before completing
    const relations = [
      'booking',
      'booking.showtime',
      'booking.bookingSeats',
      'booking.bookingSeats.seat',
    ] as const;

    let payment =
      (await this.paymentRepo.findOne({ where: { id: paymentId }, relations: relations as any })) ||
      (await this.paymentRepo.findOne({ where: { transaction_id: orderId }, relations: relations as any })) ||
      (await this.paymentRepo.findOne({ where: { transaction_id: transactionId }, relations: relations as any }));

    if (!payment && bookingIdFromExtra) {
      payment = await this.paymentRepo.findOne({
        where: { booking: { id: bookingIdFromExtra } as any },
        order: { id: 'DESC' as any },
        relations: relations as any,
      });
    }

    if (!payment && bookingIdFromExtra) {
      const booking = await this.bookingRepo.findOne({
        where: { id: bookingIdFromExtra },
        relations: ['bookingSeats', 'bookingSeats.seat', 'showtime'],
      });
      if (booking) {
        // tránh tạo trùng nếu đã có payment completed
        const existingCompleted = await this.paymentRepo.findOne({
          where: {
            booking: { id: bookingIdFromExtra } as any,
            payment_status: PaymentStatus.COMPLETED,
          },
        });
        if (!existingCompleted) {
          const newPayment = this.paymentRepo.create({
            booking,
            payment_method: PaymentMethod.MOMO,
            payment_status: success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
            amount: Number(payload?.amount) || booking.totalPriceMovie,
            transaction_id: transactionId || orderId,
            payment_time: new Date(),
          });
          payment = await this.paymentRepo.save(newPayment);
          const createdPaymentId = payment ? payment.id : 'unknown';
          this.logger.warn(
            `[MOMO][IPN] Created missing payment for booking ${bookingIdFromExtra} with id=${createdPaymentId} (fallback)`,
          );
        }
      }
    }

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const resolvedPaymentId = payment.id;

    try {
      await this.completePayment(resolvedPaymentId, transactionId, success);
    } catch (error) {
      this.logger.error(
        `[MOMO][IPN] Failed to complete payment ${resolvedPaymentId}: ${error?.message}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }

    return { success, paymentId: resolvedPaymentId };
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