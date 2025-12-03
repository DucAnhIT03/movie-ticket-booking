import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as qs from 'qs';

export interface VnpayPaymentUrlParams {
  amount: number; 
  orderId: string; 
  orderInfo: string; 
  returnUrl: string; 
  ipAddr: string; 
  locale?: string;
}

export interface VnpayCallbackParams {
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode?: string;
  vnp_TmnCode?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionStatus?: string;
  vnp_TxnRef?: string;
  vnp_SecureHash?: string;
  [key: string]: any; 
}

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);
  private readonly tmnCode: string;
  private readonly secretKey: string;
  private readonly vnpUrl: string;
  private readonly vnpReturnUrl: string;
  private readonly vnpApiUrl: string;

  constructor(private configService: ConfigService) {
   
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
    this.secretKey = this.configService.get<string>('VNPAY_SECRET_KEY') || '';
    
    // URL môi trường (sandbox hoặc production)
    const isProduction = this.configService.get<string>('VNPAY_ENV') === 'production';
    this.vnpUrl = isProduction
      ? 'https://www.vnpayment.vn/paymentv2/vpcpay.html'
      : 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    
    this.vnpApiUrl = isProduction
      ? 'https://www.vnpayment.vn/merchant_webapi/api/transaction'
      : 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
    
    
    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    this.vnpReturnUrl = this.configService.get<string>('VNPAY_RETURN_URL') || `${baseUrl}/api/payments/vnpay/return`;
    
    
    if (!this.tmnCode || !this.secretKey) {
      console.warn('⚠️  VNPAY configuration is missing. Please check VNPAY_TMN_CODE and VNPAY_SECRET_KEY in environment variables.');
    }
  }

  
  createPaymentUrl(params: VnpayPaymentUrlParams): string {
    if (!this.tmnCode || !this.secretKey) {
      throw new BadRequestException('VNPAY configuration is missing. Please check VNPAY_TMN_CODE and VNPAY_SECRET_KEY in environment variables.');
    }

    const date = new Date();
    const createDate = this.formatDate(date);
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 phút

    const orderId = params.orderId;
    const amount = params.amount;
    const orderInfo = params.orderInfo;
    const returnUrl = params.returnUrl || this.vnpReturnUrl;
    const ipAddr = params.ipAddr || '127.0.0.1';
    const locale = params.locale || 'vn';

    
    if (!orderId || orderId.trim() === '') {
      throw new BadRequestException('Order ID is required');
    }
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    if (!returnUrl || (!returnUrl.startsWith('http://') && !returnUrl.startsWith('https://'))) {
      throw new BadRequestException('Return URL must be a valid HTTP/HTTPS URL');
    }

    
    const vnp_Params: Record<string, string> = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
   
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_BankCode'] = 'QR';
    vnp_Params['vnp_Amount'] = Math.round(amount * 100).toString();
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    
    const filteredParams: Record<string, string> = {};
    for (const key in vnp_Params) {
      const value = vnp_Params[key];
      if (value !== undefined && value !== null && value !== '') {
        filteredParams[key] = String(value);
      }
    }

    
    const sortedParams = this.sortObject(filteredParams);
    
   
    const rawQueryParams = qs.stringify(sortedParams, { encode: false });
    
    
    const secureHash = this.createSecureHash(rawQueryParams);
    

    const finalParams = {
      ...sortedParams,
      vnp_SecureHashType: 'SHA512',
      vnp_SecureHash: secureHash,
    };
    const finalQueryString = qs.stringify(finalParams, { encode: false });
    
    const fullUrl = `${this.vnpUrl}?${finalQueryString}`;
    
   
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug('VNPAY raw params:', rawQueryParams);
      this.logger.debug('VNPAY final params:', finalQueryString);
      console.log('VNPAY Payment URL created:', {
        orderId,
        amount: amount * 100,
        orderInfo,
        returnUrl,
        tmnCode: this.tmnCode,
        secureHash: secureHash.substring(0, 20) + '...', 
        urlLength: fullUrl.length,
        hasAllParams: sortedParams && Object.keys(sortedParams).length > 0,
      });
      console.log('VNPAY URL (first 200 chars):', fullUrl.substring(0, 200));
    }
    
    
    if (!fullUrl || fullUrl.length < 100) {
      throw new BadRequestException('VNPAY URL không hợp lệ. Vui lòng kiểm tra cấu hình.');
    }
    
    return fullUrl;
  }

 
  verifyReturnUrl(params: any): { isValid: boolean; responseCode: string; transactionId?: string; amount?: number } {
  
    if (!params.vnp_SecureHash) {
      return {
        isValid: false,
        responseCode: params.vnp_ResponseCode || '99',
      };
    }

    const secureHash = params.vnp_SecureHash;
    
    const filteredParams: Record<string, string> = {};
    for (const key in params) {
      if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && params[key] !== undefined && params[key] !== null && params[key] !== '') {
        filteredParams[key] = String(params[key]);
      }
    }
    
    
    const sortedParams = this.sortObject(filteredParams);
    const rawQueryParams = qs.stringify(sortedParams, { encode: false });
    
    const checkSum = this.createSecureHash(rawQueryParams);
    
    const isValid = secureHash.toLowerCase() === checkSum.toLowerCase();
    
    const amount = params.vnp_Amount ? parseInt(params.vnp_Amount, 10) / 100 : undefined;
    
    return {
      isValid,
      responseCode: params.vnp_ResponseCode || '99',
      transactionId: params.vnp_TransactionNo,
      amount,
    };
  }


  private createSecureHash(queryString: string): string {
    const hmac = crypto.createHmac('sha512', this.secretKey);
    hmac.update(queryString, 'utf-8');
    return hmac.digest('hex');
  }

  
  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    
    return sorted;
  }

  
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }


  getIpAddress(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1'
    );
  }

}




