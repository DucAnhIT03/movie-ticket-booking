import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SePayPgClient, OnetimePaymentCheckoutFields } from 'sepay-pg-node';

type InitCheckoutParams = {
  orderInvoiceNumber: string;
  amount: number;
  description: string;
  paymentMethod?: 'BANK_TRANSFER' | 'NAPAS_BANK_TRANSFER';
  currency?: string;
  customerId?: string;
  successUrl?: string;
  errorUrl?: string;
  cancelUrl?: string;
  customData?: string;
};

@Injectable()
export class SepayService {
  private readonly logger = new Logger(SepayService.name);
  private client: SePayPgClient | null = null;
  private checkoutUrl: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const merchantId = this.configService.get<string>('SEPAY_MERCHANT_ID');
    const secretKey = this.configService.get<string>('SEPAY_SECRET_KEY');
    const env =
      (this.configService.get<string>('SEPAY_ENV') || 'sandbox').toLowerCase() === 'production'
        ? 'production'
        : 'sandbox';

    if (!merchantId || !secretKey) {
      this.logger.warn('SePay merchant credentials are missing. SePay payments are disabled.');
      return;
    }

    this.ensureBtoaPolyfill();

    this.client = new SePayPgClient({
      env,
      merchant_id: merchantId,
      secret_key: secretKey,
    });

    this.checkoutUrl = this.client.checkout.initCheckoutUrl();
  }

  isEnabled(): boolean {
    return Boolean(this.client && this.checkoutUrl);
  }

  initOneTimeCheckout(params: InitCheckoutParams) {
    this.ensureClient();
    const payload: OnetimePaymentCheckoutFields = {
      operation: 'PURCHASE',
      payment_method: params.paymentMethod || 'BANK_TRANSFER',
      order_invoice_number: params.orderInvoiceNumber,
      order_amount: Math.round(params.amount),
      currency: params.currency || 'VND',
      order_description: params.description,
      customer_id: params.customerId,
      success_url: params.successUrl,
      error_url: params.errorUrl,
      cancel_url: params.cancelUrl,
      custom_data: params.customData,
    };

    const fields = this.client!.checkout.initOneTimePaymentFields(payload);

    return {
      checkoutUrl: this.checkoutUrl!,
      fields,
    };
  }

  verifySignature(payload: Record<string, any>): boolean {
    this.ensureClient();
    const providedSignature = payload?.signature || payload?.Signature || payload?.SIGNATURE;
    if (!providedSignature) {
      return false;
    }

    const expected = this.client!.checkout.signFields(payload);
    return providedSignature === expected;
  }

  async retrieveOrder(orderInvoiceNumber: string): Promise<any> {
    this.ensureClient();

    if (!orderInvoiceNumber) {
      throw new BadRequestException('order_invoice_number is required');
    }

    const response = await this.client!.order.retrieve(orderInvoiceNumber);
    return response?.data ?? response;
  }

  private ensureClient() {
    if (!this.isEnabled()) {
      throw new BadRequestException('SePay integration is not configured.');
    }
  }

  private ensureBtoaPolyfill() {
    if (typeof (globalThis as any).btoa === 'undefined') {
      (globalThis as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
    }
  }
}


