import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Payment } from 'src/shared/schemas/payment.entity';
import { Booking } from 'src/shared/schemas/booking.entity';
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
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

    // Sử dụng queryRunner với transaction explicit để đảm bảo payment được commit ngay lập tức
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = queryRunner.manager.create(Payment, paymentData);
      const savedPayment = await queryRunner.manager.save(Payment, payment);
      
      // Commit transaction ngay lập tức
      await queryRunner.commitTransaction();
      
      this.logger.debug(`[PAYMENT] Created and committed payment ${savedPayment.id} for booking ${bookingId}`);
      
      // Verify payment was saved với retry (sử dụng connection mới)
      let verifyAttempts = 0;
      const maxVerifyAttempts = 5;
      let verified = false;
      
      while (verifyAttempts < maxVerifyAttempts && !verified) {
        // Sử dụng dataSource.query để đảm bảo dùng connection mới, thấy được committed data
        const verifyPayment = await this.dataSource.query(
          `SELECT id, booking_id, payment_status, payment_method, amount FROM payments WHERE id = ? LIMIT 1`,
          [savedPayment.id],
        );
        
        if (verifyPayment && verifyPayment.length > 0) {
          verified = true;
          this.logger.debug(
            `[PAYMENT] Created payment ${savedPayment.id} for booking ${bookingId}. Verified in database: ${JSON.stringify(verifyPayment[0])}`,
          );
        } else {
          this.logger.warn(`[PAYMENT] Payment ${savedPayment.id} not found in database after creation (attempt ${verifyAttempts + 1})`);
          if (verifyAttempts < maxVerifyAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200 * (verifyAttempts + 1)));
          }
        }
        verifyAttempts++;
      }
      
      if (!verified) {
        this.logger.error(`[PAYMENT] CRITICAL: Payment ${savedPayment.id} not found in database after ${maxVerifyAttempts} verification attempts!`);
        // Log thêm thông tin để debug
        const allPayments = await this.dataSource.query(
          `SELECT id, booking_id, payment_status FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 10`,
          [bookingId],
        );
        this.logger.error(`[PAYMENT] All payments for booking ${bookingId}: ${JSON.stringify(allPayments)}`);
        throw new Error(`Payment ${savedPayment.id} was not saved to database`);
      }
      
      return savedPayment;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error(`[PAYMENT] Error creating payment for booking ${bookingId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async completePayment(
    paymentId: number,
    transactionId: string,
    success = true,
  ) {
    this.logger.log(
      `[PAYMENT] completePayment start id=${paymentId}, tx=${transactionId}, success=${success}`,
    );
    let payment = await this.paymentRepo.findOne({
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
        this.logger.log(
          `[PAYMENT] Found payment by transaction_id=${transactionId}, actual id=${byTx.id}`,
        );
        payment = byTx;
        paymentId = byTx.id;
      }
    }

    // Additional fallback: try to find by orderId format (PAY{id}_timestamp)
    if (!payment && transactionId) {
      const orderIdMatch = transactionId.match(/^PAY(\d+)_/);
      if (orderIdMatch) {
        const orderIdPaymentId = Number(orderIdMatch[1]);
        if (orderIdPaymentId !== paymentId) {
          this.logger.debug(
            `[PAYMENT] Trying to find payment by orderId format: id=${orderIdPaymentId}`,
          );
          const byOrderId = await this.paymentRepo.findOne({
            where: { id: orderIdPaymentId },
            relations: [
              'booking',
              'booking.showtime',
              'booking.bookingSeats',
              'booking.bookingSeats.seat',
            ],
          });
          if (byOrderId) {
            this.logger.log(
              `[PAYMENT] Found payment by orderId format, actual id=${byOrderId.id}`,
            );
            payment = byOrderId;
            paymentId = byOrderId.id;
          }
        }
      }
    }

    if (!payment) {
      this.logger.error(
        `[PAYMENT] Payment not found: id=${paymentId}, transactionId=${transactionId}`,
      );
      throw new NotFoundException('Payment not found');
    }

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

    // Đảm bảo booking được load đúng
    if (!payment.booking) {
      this.logger.error(`[MOMO] Payment ${paymentId} has no booking relation. Reloading...`);
      // Thử reload với raw SQL
      const rawPayment = await this.dataSource.query(
        `SELECT booking_id FROM payments WHERE id = ? LIMIT 1`,
        [paymentId],
      );
      if (rawPayment && rawPayment.length > 0 && rawPayment[0].booking_id) {
        const bookingId = rawPayment[0].booking_id;
        const booking = await this.bookingRepo.findOne({
          where: { id: bookingId },
          relations: ['showtime', 'showtime.movie'],
        });
        if (booking) {
          (payment as any).booking = booking;
          this.logger.debug(`[MOMO] Reloaded booking ${bookingId} for payment ${paymentId}`);
        } else {
          throw new NotFoundException(`Booking ${bookingId} not found for payment ${paymentId}`);
        }
      } else {
        throw new NotFoundException(`Payment ${paymentId} has no associated booking`);
      }
    }

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
    
    // Đảm bảo bookingId được lấy đúng
    const bookingId = (payment.booking as any)?.id || payment.booking?.id;
    if (!bookingId) {
      this.logger.error(`[MOMO] CRITICAL: Cannot get bookingId for payment ${paymentId}. Payment booking:`, payment.booking);
      throw new BadRequestException('Không thể lấy thông tin booking từ payment');
    }
    
    const extraData = Buffer.from(
      JSON.stringify({
        paymentId,
        bookingId: bookingId,
      }),
    ).toString('base64');

    const effectiveIpnUrl = ipnUrl || returnUrl;
    this.logger.log(
      `[MOMO] Creating payment: paymentId=${paymentId}, bookingId=${bookingId}, orderId=${orderId}, returnUrl=${returnUrl}, ipnUrl=${effectiveIpnUrl}`,
    );

    // Lưu tạm orderId vào transaction_id để tra cứu fallback nếu IPN về mà không parse được id
    // Save orderId to transaction_id for IPN lookup fallback
    if (!payment.transaction_id) {
      payment.transaction_id = orderId;
      
      // Sử dụng queryRunner với transaction explicit để đảm bảo commit ngay lập tức
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Update payment với transaction_id
        await queryRunner.manager.update(
          Payment,
          { id: paymentId },
          { transaction_id: orderId },
        );
        
        // Commit transaction ngay lập tức
        await queryRunner.commitTransaction();
        
        this.logger.debug(`[MOMO] Saved and committed payment ${paymentId} with transaction_id=${orderId}`);
        
        // Verify payment was saved correctly using raw SQL (bypass TypeORM cache)
        // Sử dụng một connection mới để đảm bảo thấy được committed data
        let verifyAttempts = 0;
        const maxVerifyAttempts = 5;
        let verified = false;
        
        while (verifyAttempts < maxVerifyAttempts && !verified) {
          // Sử dụng raw SQL với connection mới để query
          const rawVerify = await this.dataSource.query(
            `SELECT id, booking_id, transaction_id, payment_status, payment_method, amount, created_at FROM payments WHERE id = ? LIMIT 1`,
            [paymentId],
          );
          
          if (rawVerify && rawVerify.length > 0) {
            if (rawVerify[0].transaction_id === orderId) {
              verified = true;
              this.logger.debug(
                `[MOMO] Verified payment ${paymentId} transaction_id=${orderId} (raw SQL verified on attempt ${verifyAttempts + 1})`,
              );
            } else {
              this.logger.warn(
                `[MOMO] Payment ${paymentId} transaction_id mismatch: expected ${orderId}, got ${rawVerify[0].transaction_id} (attempt ${verifyAttempts + 1})`,
              );
            }
          } else {
            this.logger.warn(
              `[MOMO] Payment ${paymentId} not found in database after save and commit (attempt ${verifyAttempts + 1})`,
            );
          }
          
          if (!verified && verifyAttempts < maxVerifyAttempts - 1) {
            // Wait a bit longer for database to commit
            await new Promise((resolve) => setTimeout(resolve, 200 * (verifyAttempts + 1)));
          }
          verifyAttempts++;
        }
        
        if (!verified) {
          this.logger.error(
            `[MOMO] CRITICAL: Payment ${paymentId} could not be verified after ${maxVerifyAttempts} attempts even after commit!`,
          );
          // Log thêm thông tin để debug
          const allPayments = await this.dataSource.query(
            `SELECT id, booking_id, transaction_id FROM payments WHERE booking_id = ? OR id = ? ORDER BY id DESC LIMIT 10`,
            [(payment.booking as any)?.id || payment.booking?.id, paymentId],
          );
          this.logger.error(`[MOMO] All related payments: ${JSON.stringify(allPayments)}`);
        }
      } catch (error) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        this.logger.error(`[MOMO] Error updating payment ${paymentId} transaction_id:`, error);
        throw error;
      } finally {
        await queryRunner.release();
      }
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

    // orderId format có thể là:
    // - PAY{paymentId}_BK{bookingId}_PND{timestamp} (format cũ)
    // - PAY{paymentId}_{timestamp} (format mới)
    const orderId = payload?.orderId as string;
    
    // Thử match format cũ trước
    let matched = orderId?.match(/^PAY(\d+)_BK(\d+)_PND/);
    let paymentId = matched ? Number(matched[1]) : null;
    let bookingIdFromOrder: number | null = matched && matched[2] ? Number(matched[2]) : null;
    
    // Nếu không match format cũ, thử format mới: PAY{paymentId}_{timestamp}
    if (!paymentId) {
      matched = orderId?.match(/^PAY(\d+)_(\d+)$/);
      paymentId = matched ? Number(matched[1]) : null;
    }

    let bookingIdFromExtra: number | null = bookingIdFromOrder;
    // Fallback: lấy paymentId/bookingId từ extraData nếu orderId không parse được
    if (payload?.extraData) {
      try {
        const decodedExtra = Buffer.from(payload.extraData, 'base64').toString('utf8');
        const parsedExtra = JSON.parse(decodedExtra);
        this.logger.debug(`[MOMO][IPN] Parsed extraData: ${JSON.stringify(parsedExtra)}`);
        
        if (!paymentId && parsedExtra?.paymentId) {
          paymentId = Number(parsedExtra.paymentId);
          this.logger.debug(`[MOMO][IPN] Got paymentId from extraData: ${paymentId}`);
        }
        if (parsedExtra?.bookingId) {
          const parsedBookingId = Number(parsedExtra.bookingId);
          // Validate bookingId - nó không nên bằng paymentId (trừ khi thực sự trùng hợp)
          if (parsedBookingId && parsedBookingId > 0) {
            bookingIdFromExtra = parsedBookingId;
            this.logger.debug(`[MOMO][IPN] Got bookingId from extraData: ${bookingIdFromExtra}`);
            
            // Warning nếu bookingId trùng với paymentId (có thể là bug)
            if (paymentId && bookingIdFromExtra === paymentId) {
              this.logger.warn(
                `[MOMO][IPN] WARNING: bookingId (${bookingIdFromExtra}) equals paymentId (${paymentId}). This might indicate a bug.`,
              );
            }
          } else {
            this.logger.warn(`[MOMO][IPN] Invalid bookingId in extraData: ${parsedExtra.bookingId}`);
          }
        }
      } catch (err) {
        this.logger.warn(`[MOMO] Không thể parse extraData cho orderId=${orderId}: ${err?.message}`);
      }
    }
    
    // Final validation
    if (!paymentId) {
      throw new BadRequestException('orderId hoặc extraData không hợp lệ - không tìm thấy paymentId');
    }
    
    this.logger.debug(
      `[MOMO][IPN] Resolved IDs: paymentId=${paymentId}, bookingIdFromOrder=${bookingIdFromOrder}, bookingIdFromExtra=${bookingIdFromExtra}`,
    );

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

    // Retry logic với exponential backoff để xử lý race condition
    // IPN có thể đến trước khi payment được commit vào database
    const maxRetries = 5;
    const initialDelay = 200; // 200ms
    let payment: Payment | null = null;

    // Debug: Kiểm tra payment có tồn tại trong database không ngay từ đầu
    // Sử dụng queryRunner với connection mới để đảm bảo thấy được committed data
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      const initialCheck = await queryRunner.query(
        `SELECT id, booking_id, transaction_id, payment_status, payment_method, amount, created_at FROM payments WHERE id = ? LIMIT 1`,
        [paymentId],
      );
      this.logger.debug(
        `[MOMO][IPN] Initial database check for paymentId=${paymentId}: ${initialCheck && initialCheck.length > 0 ? `FOUND - ${JSON.stringify(initialCheck[0])}` : 'NOT FOUND'}`,
      );
      
      // Debug: Kiểm tra tất cả payments có booking_id = bookingIdFromExtra để xem payment có tồn tại không
      if (bookingIdFromExtra) {
        const allPaymentsForBooking = await queryRunner.query(
          `SELECT id, booking_id, transaction_id, payment_status, payment_method, amount, created_at FROM payments WHERE booking_id = ? ORDER BY id DESC`,
          [bookingIdFromExtra],
        );
        this.logger.debug(
          `[MOMO][IPN] All payments for bookingId=${bookingIdFromExtra}: ${allPaymentsForBooking.length} payment(s) - ${JSON.stringify(allPaymentsForBooking)}`,
        );
      }
      
      // Debug: Kiểm tra payments có transaction_id = orderId
      const paymentsByOrderId = await queryRunner.query(
        `SELECT id, booking_id, transaction_id, payment_status, payment_method, amount, created_at FROM payments WHERE transaction_id = ?`,
        [orderId],
      );
      this.logger.debug(
        `[MOMO][IPN] Payments with transaction_id=${orderId}: ${paymentsByOrderId.length} payment(s) - ${JSON.stringify(paymentsByOrderId)}`,
      );
      
      // Debug: Kiểm tra booking có tồn tại không
      if (bookingIdFromExtra) {
        const bookingCheck = await queryRunner.query(
          `SELECT id, user_id, showtime_id, total_price_movie, created_at FROM Bookings WHERE id = ? LIMIT 1`,
          [bookingIdFromExtra],
        );
        this.logger.debug(
          `[MOMO][IPN] Booking check for bookingId=${bookingIdFromExtra}: ${bookingCheck && bookingCheck.length > 0 ? `FOUND - ${JSON.stringify(bookingCheck[0])}` : 'NOT FOUND'}`,
        );
      }
    } finally {
      await queryRunner.release();
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Tìm payment bằng nhiều cách:
      // 1. Tìm bằng paymentId (TypeORM)
      payment = await this.paymentRepo.findOne({ 
        where: { id: paymentId }, 
        relations: relations as any 
      });
      
      if (payment) {
        this.logger.debug(`[MOMO][IPN] Found payment by id=${paymentId} on attempt ${attempt + 1} (TypeORM)`);
        break;
      }
      
      // 1b. Tìm bằng paymentId (Raw SQL với connection mới - bypass TypeORM cache/transaction)
      if (!payment) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
          const rawPayment = await queryRunner.query(
            `SELECT id, booking_id, transaction_id, payment_status, payment_method, amount, created_at FROM payments WHERE id = ? LIMIT 1`,
            [paymentId],
          );
          if (rawPayment && rawPayment.length > 0) {
            this.logger.debug(
              `[MOMO][IPN] Found payment by id=${paymentId} using raw SQL on attempt ${attempt + 1}. Data: ${JSON.stringify(rawPayment[0])}`,
            );
            // Load with relations
            payment = await this.paymentRepo.findOne({
              where: { id: paymentId },
              relations: relations as any,
            });
            if (payment) {
              this.logger.debug(`[MOMO][IPN] Successfully loaded payment ${paymentId} with relations`);
              break;
            } else {
              this.logger.warn(`[MOMO][IPN] Payment ${paymentId} found in raw SQL but TypeORM cannot load it with relations`);
            }
          } else {
            this.logger.debug(`[MOMO][IPN] Payment ${paymentId} NOT found in database (raw SQL) on attempt ${attempt + 1}`);
          }
        } finally {
          await queryRunner.release();
        }
      }
      
      // 2. Tìm bằng orderId (transaction_id có thể là orderId)
      if (!payment) {
        payment = await this.paymentRepo.findOne({ 
          where: { transaction_id: orderId }, 
          relations: relations as any 
        });
        if (payment) {
          this.logger.debug(`[MOMO][IPN] Found payment by transaction_id=${orderId} on attempt ${attempt + 1}`);
          break;
        }
      }
      
      // 2b. Tìm bằng orderId (Raw SQL)
      if (!payment) {
        const rawPayment = await this.dataSource.query(
          `SELECT * FROM payments WHERE transaction_id = ? LIMIT 1`,
          [orderId],
        );
        if (rawPayment && rawPayment.length > 0) {
          const foundId = rawPayment[0].id;
          this.logger.debug(`[MOMO][IPN] Found payment by transaction_id=${orderId} using raw SQL, id=${foundId} on attempt ${attempt + 1}`);
          payment = await this.paymentRepo.findOne({
            where: { id: foundId },
            relations: relations as any,
          });
          if (payment) break;
        }
      }
      
      // 3. Tìm bằng transactionId từ MoMo (transId)
      if (!payment && transactionId && transactionId !== orderId) {
        payment = await this.paymentRepo.findOne({ 
          where: { transaction_id: transactionId }, 
          relations: relations as any 
        });
        if (payment) {
          this.logger.debug(`[MOMO][IPN] Found payment by transaction_id=${transactionId} on attempt ${attempt + 1}`);
          break;
        }
      }

      // 4. Tìm bằng booking_id sử dụng query builder
      if (!payment && bookingIdFromExtra) {
        payment = await this.paymentRepo
          .createQueryBuilder('payment')
          .leftJoinAndSelect('payment.booking', 'booking')
          .leftJoinAndSelect('booking.showtime', 'showtime')
          .leftJoinAndSelect('booking.bookingSeats', 'bookingSeats')
          .leftJoinAndSelect('bookingSeats.seat', 'seat')
          .where('payment.booking_id = :bookingId', { bookingId: bookingIdFromExtra })
          .orderBy('payment.id', 'DESC')
          .getOne();
        if (payment) {
          this.logger.debug(`[MOMO][IPN] Found payment by booking_id=${bookingIdFromExtra} on attempt ${attempt + 1}`);
          break;
        }
      }

      // 4b. Tìm bằng booking_id (Raw SQL)
      if (!payment && bookingIdFromExtra) {
        const rawPayment = await this.dataSource.query(
          `SELECT * FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 1`,
          [bookingIdFromExtra],
        );
        if (rawPayment && rawPayment.length > 0) {
          const foundId = rawPayment[0].id;
          this.logger.debug(`[MOMO][IPN] Found payment by booking_id=${bookingIdFromExtra} using raw SQL, id=${foundId} on attempt ${attempt + 1}`);
          payment = await this.paymentRepo.findOne({
            where: { id: foundId },
            relations: relations as any,
          });
          if (payment) break;
        }
      }

      if (payment) {
        break; // Found payment, exit retry loop
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        this.logger.debug(
          `[MOMO][IPN] Payment not found on attempt ${attempt + 1}/${maxRetries} (paymentId=${paymentId}, orderId=${orderId}, bookingId=${bookingIdFromExtra}), retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Fallback: tạo payment mới nếu vẫn không tìm thấy và có bookingId
    if (!payment && bookingIdFromExtra) {
      // Nếu bookingId trùng với paymentId, có thể là bug - thử lấy booking_id từ payment trước
      if (bookingIdFromExtra === paymentId) {
        this.logger.warn(
          `[MOMO][IPN] bookingId (${bookingIdFromExtra}) equals paymentId (${paymentId}). Trying to get real booking_id from payment...`,
        );
        const rawPayment = await this.dataSource.query(
          `SELECT booking_id FROM payments WHERE id = ? LIMIT 1`,
          [paymentId],
        );
        if (rawPayment && rawPayment.length > 0 && rawPayment[0].booking_id) {
          const realBookingId = rawPayment[0].booking_id;
          this.logger.debug(`[MOMO][IPN] Found real booking_id=${realBookingId} from payment ${paymentId}`);
          bookingIdFromExtra = realBookingId;
        }
      }
      
      this.logger.warn(
        `[MOMO][IPN] Payment not found after all retries, attempting fallback creation for bookingId=${bookingIdFromExtra}`,
      );
      
      // Try to find booking using raw SQL first
      const rawBooking = await this.dataSource.query(
        `SELECT * FROM Bookings WHERE id = ? LIMIT 1`,
        [bookingIdFromExtra],
      );
      
      let booking: Booking | null = null;
      if (rawBooking && rawBooking.length > 0 && bookingIdFromExtra) {
        // Booking exists, load with relations
        booking = await this.bookingRepo.findOne({
          where: { id: bookingIdFromExtra },
          relations: ['bookingSeats', 'bookingSeats.seat', 'showtime'],
        });
      } else if (bookingIdFromExtra) {
        // Try TypeORM query as fallback
        booking = await this.bookingRepo.findOne({
          where: { id: bookingIdFromExtra },
          relations: ['bookingSeats', 'bookingSeats.seat', 'showtime'],
        });
      }
      
      if (!booking) {
        this.logger.error(`[MOMO][IPN] Booking ${bookingIdFromExtra} not found for fallback payment creation (checked with raw SQL and TypeORM)`);
      } else {
        // Kiểm tra xem đã có payment completed chưa (sử dụng query builder)
        const existingCompleted = await this.paymentRepo
          .createQueryBuilder('payment')
          .where('payment.booking_id = :bookingId', { bookingId: bookingIdFromExtra })
          .andWhere('payment.payment_status = :status', { status: PaymentStatus.COMPLETED })
          .getOne();
          
        if (existingCompleted) {
          this.logger.warn(
            `[MOMO][IPN] Booking ${bookingIdFromExtra} already has completed payment ${existingCompleted.id}, using existing payment`,
          );
          // Load full relations for existing payment
          payment = await this.paymentRepo.findOne({
            where: { id: existingCompleted.id },
            relations: relations as any,
          });
        } else {
          // Tạo payment mới
          const bookingTotalPrice = (booking as any).totalPriceMovie || 0;
          const newPayment = this.paymentRepo.create({
            booking,
            payment_method: PaymentMethod.MOMO,
            payment_status: success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
            amount: Number(payload?.amount) || bookingTotalPrice,
            transaction_id: transactionId || orderId,
            payment_time: new Date(),
          });
          payment = await this.paymentRepo.save(newPayment);
          
          // Load với relations
          if (payment) {
            payment = await this.paymentRepo.findOne({
              where: { id: payment.id },
              relations: relations as any,
            });
          }
          
          const createdPaymentId = payment ? payment.id : 'unknown';
          this.logger.warn(
            `[MOMO][IPN] Created missing payment for booking ${bookingIdFromExtra} with id=${createdPaymentId} (fallback)`,
          );
        }
      }
    }

    if (!payment) {
      this.logger.error(
        `[MOMO][IPN] Payment not found after ${maxRetries} attempts: paymentId=${paymentId}, orderId=${orderId}, transactionId=${transactionId}, bookingId=${bookingIdFromExtra}`,
      );
      throw new NotFoundException(`Payment not found for orderId=${orderId}`);
    }

    const resolvedPaymentId = payment.id;
    this.logger.log(
      `[MOMO][IPN] Found payment: id=${resolvedPaymentId}, currentStatus=${payment.payment_status}`,
    );

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