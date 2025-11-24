import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

export interface VnpayPaymentUrlParams {
  amount: number; // Số tiền (VND)
  orderId: string; // Mã đơn hàng (unique)
  orderInfo: string; // Thông tin đơn hàng
  returnUrl: string; // URL trả về sau khi thanh toán
  ipAddr: string; // IP của khách hàng
  locale?: string; // Ngôn ngữ (vn, en)
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
  [key: string]: any; // Cho phép các field khác từ VNPAY
}

@Injectable()
export class VnpayService {
  private readonly tmnCode: string;
  private readonly secretKey: string;
  private readonly vnpUrl: string;
  private readonly vnpReturnUrl: string;
  private readonly vnpApiUrl: string;

  constructor(private configService: ConfigService) {
    // Lấy config từ environment variables
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
    
    // Return URL từ config hoặc default
    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    this.vnpReturnUrl = this.configService.get<string>('VNPAY_RETURN_URL') || `${baseUrl}/api/payments/vnpay/return`;
    
    // Log warning nếu thiếu config (chỉ log, không throw để tránh crash khi khởi động)
    if (!this.tmnCode || !this.secretKey) {
      console.warn('⚠️  VNPAY configuration is missing. Please check VNPAY_TMN_CODE and VNPAY_SECRET_KEY in environment variables.');
    }
  }

  /**
   * Tạo payment URL để redirect đến VNPAY
   */
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

    // Validate các tham số
    if (!orderId || orderId.trim() === '') {
      throw new BadRequestException('Order ID is required');
    }
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    if (!returnUrl || (!returnUrl.startsWith('http://') && !returnUrl.startsWith('https://'))) {
      throw new BadRequestException('Return URL must be a valid HTTP/HTTPS URL');
    }

    // Tạo các tham số
    const vnp_Params: Record<string, string> = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    // VNPAY yêu cầu orderInfo không được encode trước, sẽ được encode khi tạo query string
    // Nhưng cần đảm bảo không có ký tự đặc biệt gây lỗi
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = Math.round(amount * 100).toString(); // VNPAY yêu cầu số tiền nhân 100, làm tròn để tránh số thập phân
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    // Sắp xếp các tham số theo thứ tự alphabet
    const sortedParams = this.sortObject(vnp_Params);
    
    // Tạo query string - querystring.stringify() sẽ tự động encode các giá trị
    const querystringParams = querystring.stringify(sortedParams);
    
    // Tạo secure hash
    const secureHash = this.createSecureHash(querystringParams);
    
    // Thêm secure hash vào query string
    const finalQueryString = `${querystringParams}&vnp_SecureHash=${secureHash}`;
    
    // Log để debug (chỉ log trong development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('VNPAY Payment URL created:', {
        orderId,
        amount: amount * 100,
        orderInfo,
        returnUrl,
        tmnCode: this.tmnCode,
      });
    }
    
    // Trả về URL hoàn chỉnh
    return `${this.vnpUrl}?${finalQueryString}`;
  }

  /**
   * Verify callback từ VNPAY
   */
  verifyReturnUrl(params: any): { isValid: boolean; responseCode: string; transactionId?: string; amount?: number } {
    // Kiểm tra secure hash có tồn tại không
    if (!params.vnp_SecureHash) {
      return {
        isValid: false,
        responseCode: params.vnp_ResponseCode || '99',
      };
    }

    const secureHash = params.vnp_SecureHash;
    
    // Loại bỏ vnp_SecureHash và vnp_SecureHashType khỏi params để tạo hash
    // Filter các giá trị undefined, null, và empty string
    const filteredParams: Record<string, string> = {};
    for (const key in params) {
      if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && params[key] !== undefined && params[key] !== null && params[key] !== '') {
        filteredParams[key] = String(params[key]);
      }
    }
    
    // Sắp xếp và tạo query string
    const sortedParams = this.sortObject(filteredParams);
    const querystringParams = querystring.stringify(sortedParams);
    
    // Tạo hash để so sánh
    const checkSum = this.createSecureHash(querystringParams);
    
    // So sánh hash (case-insensitive theo chuẩn VNPAY)
    const isValid = secureHash.toLowerCase() === checkSum.toLowerCase();
    
    // Parse amount từ VNPAY (amount được gửi nhân 100)
    const amount = params.vnp_Amount ? parseInt(params.vnp_Amount, 10) / 100 : undefined;
    
    return {
      isValid,
      responseCode: params.vnp_ResponseCode || '99',
      transactionId: params.vnp_TransactionNo,
      amount,
    };
  }

  /**
   * Tạo secure hash theo chuẩn VNPAY
   */
  private createSecureHash(queryString: string): string {
    const hmac = crypto.createHmac('sha512', this.secretKey);
    hmac.update(queryString, 'utf-8');
    return hmac.digest('hex');
  }

  /**
   * Sắp xếp object theo key
   */
  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    
    return sorted;
  }

  /**
   * Format date theo chuẩn VNPAY (yyyyMMddHHmmss)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Lấy IP address từ request
   */
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




