import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from 'src/shared/schemas/payment.entity';
import { PaymentStatus } from 'src/common/constrants/enums';

/**
 * Scheduler để tự động unlock ghế sau 5 phút nếu payment chưa được thanh toán
 * Chạy mỗi phút để kiểm tra và unlock các payment PENDING quá 5 phút
 */
@Injectable()
export class PaymentTimeoutScheduler {
  private readonly logger = new Logger(PaymentTimeoutScheduler.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  /**
   * Chạy mỗi phút để kiểm tra và unlock ghế
   * Payment PENDING quá 5 phút sẽ được đánh dấu là FAILED
   * Điều này sẽ tự động unlock ghế vì getBookedSeats chỉ check payment COMPLETED hoặc PENDING trong 5 phút
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handlePaymentTimeout() {
    this.logger.debug('Checking for expired pending payments...');

    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Tìm tất cả payment PENDING được tạo trước 5 phút
      const expiredPayments = await this.paymentRepo.find({
        where: {
          payment_status: PaymentStatus.PENDING,
        },
        relations: ['booking'],
      });

      // Lọc các payment quá 5 phút
      // Sử dụng created_at nếu có, nếu không thì dùng payment_time hoặc id để estimate
      const paymentsToExpire = expiredPayments.filter((payment) => {
        // Kiểm tra created_at trước
        if ((payment as any).created_at) {
          return new Date((payment as any).created_at) < fiveMinutesAgo;
        }
        // Nếu không có created_at, dùng payment_time (nếu có)
        if (payment.payment_time) {
          return new Date(payment.payment_time) < fiveMinutesAgo;
        }
        // Fallback: nếu không có cả 2, skip payment này (không expire)
        return false;
      });

      if (paymentsToExpire.length === 0) {
        return;
      }

      // Đánh dấu các payment quá hạn là FAILED
      // Lưu ý: Không xóa payment, chỉ đổi status để có thể track
      const paymentIds = paymentsToExpire.map((p) => p.id);
      await this.paymentRepo.update(
        { id: paymentIds as any },
        { payment_status: PaymentStatus.FAILED },
      );

      this.logger.log(
        `Expired ${paymentsToExpire.length} pending payment(s). Seats are now available for others.`,
      );

      // Log chi tiết để debug
      if (paymentsToExpire.length > 0) {
        this.logger.debug(
          `Expired payment IDs: ${paymentIds.join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.error('Error processing payment timeout:', error);
    }
  }
}

