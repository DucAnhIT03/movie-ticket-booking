import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Payment } from 'src/shared/schemas/payment.entity';
import { PaymentStatus } from 'src/common/constrants/enums';


@Injectable()
export class PaymentTimeoutScheduler {
  private readonly logger = new Logger(PaymentTimeoutScheduler.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}


  @Cron(CronExpression.EVERY_MINUTE)
  async handlePaymentTimeout() {
    this.logger.debug('Checking for expired pending payments...');

    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    
      const expiredPayments = await this.paymentRepo.find({
        where: {
          payment_status: PaymentStatus.PENDING,
        },
        relations: ['booking'],
      });

 
      const paymentsToExpire = expiredPayments.filter((payment) => {
     
        if ((payment as any).created_at) {
          return new Date((payment as any).created_at) < fiveMinutesAgo;
        }
      
        if (payment.payment_time) {
          return new Date(payment.payment_time) < fiveMinutesAgo;
        }

        return false;
      });

      if (paymentsToExpire.length === 0) {
        return;
      }


      const paymentIds = paymentsToExpire.map((p) => p.id);
      await this.paymentRepo.update(
        { id: In(paymentIds) },
        { payment_status: PaymentStatus.FAILED },
      );

      this.logger.log(
        `Expired ${paymentsToExpire.length} pending payment(s). Seats are now available for others.`,
      );


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

