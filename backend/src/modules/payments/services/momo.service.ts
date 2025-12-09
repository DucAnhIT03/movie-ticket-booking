import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as https from 'https';

interface MomoCreateParams {
  amount: number | string;
  orderId: string;
  orderInfo: string;
  returnUrl: string;
  ipnUrl: string;
  requestType?: 'captureWallet' | 'payWithMethod';
  extraData?: string;
}

@Injectable()
export class MomoService {
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly endpointHost: string;

  constructor(private readonly configService: ConfigService) {
    // Đọc cấu hình từ ENV, fallback về sandbox mặc định để tránh crash môi trường dev
    this.partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE') || 'MOMO';
    this.accessKey =
      this.configService.get<string>('MOMO_ACCESS_KEY') || 'F8BBA842ECF85';
    this.secretKey =
      this.configService.get<string>('MOMO_SECRET_KEY') || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    this.endpointHost =
      this.configService.get<string>('MOMO_ENDPOINT') || 'test-payment.momo.vn';
  }

  async createPayment(params: MomoCreateParams) {
    const {
      amount,
      orderId,
      orderInfo,
      returnUrl,
      ipnUrl,
      requestType = 'captureWallet',
      extraData = '',
    } = params;

    const requestId = `${this.partnerCode}${Date.now()}`;

    const rawSignature =
      'accessKey=' + this.accessKey +
      '&amount=' + amount +
      '&extraData=' + extraData +
      '&ipnUrl=' + ipnUrl +
      '&orderId=' + orderId +
      '&orderInfo=' + orderInfo +
      '&partnerCode=' + this.partnerCode +
      '&redirectUrl=' + returnUrl +
      '&requestId=' + requestId +
      '&requestType=' + requestType;

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = JSON.stringify({
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount: amount.toString(),
      orderId,
      orderInfo,
      redirectUrl: returnUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    });

    const options = {
      hostname: this.endpointHost,
      port: 443,
      path: '/v2/gateway/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    return new Promise<{ payUrl: string; resultCode: number; [key: string]: any }>((resolve, reject) => {
      const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve(json);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(requestBody);
      req.end();
    });
  }

  verifySignature(payload: any): boolean {
    if (!payload || !payload.signature) return false;

    const {
      amount,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      requestId,
      responseTime,
      resultCode,
      message,
      payType,
      extraData = '',
      transId,
    } = payload;

    const rawSignature =
      'accessKey=' + this.accessKey +
      '&amount=' + amount +
      '&extraData=' + extraData +
      '&message=' + message +
      '&orderId=' + orderId +
      '&orderInfo=' + orderInfo +
      '&orderType=' + (orderType || '') +
      '&partnerCode=' + partnerCode +
      '&payType=' + (payType || '') +
      '&requestId=' + requestId +
      '&responseTime=' + responseTime +
      '&resultCode=' + resultCode +
      '&transId=' + transId;

    const computed = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    return computed === payload.signature;
  }
}

