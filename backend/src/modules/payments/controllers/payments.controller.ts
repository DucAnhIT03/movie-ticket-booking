import { Controller, Post, Body, Get, Param, Patch, UseGuards, Req, Query, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentsService } from 'src/modules/payments/services/payments.service';
import { VnpayService } from '../services/vnpay.service';
import { CreatePaymentDto } from '../dtos/request/create-payment.dto';
import { CompletePaymentDto } from '../dtos/request/complete-payment.dto';
import { CreateVnpayUrlDto } from '../dtos/request/create-vnpay-url.dto';
import { PaymentResponseDto } from '../dtos/response/payments.response.dto';
import { VnpayUrlResponseDto } from '../dtos/response/vnpay-url.response.dto';
import { VnpayWebhookResponseDto } from '../dtos/response/vnpay-webhook.response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('💳 Thanh toán')
@Controller('payments')
export class PaymentsController {
  constructor(
    private svc: PaymentsService,
    private vnpayService: VnpayService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Tạo thanh toán mới',
    description: 'Tạo một giao dịch thanh toán cho vé đã đặt'
  })
  @ApiBody({
    description: 'Thông tin thanh toán',
    type: CreatePaymentDto
  })
  @ApiResponse({ status: 201, description: 'Thanh toán đã được tạo thành công', type: PaymentResponseDto })
  async create(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const requester = req.user as any;
    const isAdmin = Array.isArray(requester?.roles) && requester.roles.includes('ROLE_ADMIN');
    const userId = requester?.id ?? requester?.sub;
    const payment = await this.svc.createPayment(dto.bookingId, dto.method, dto.amount, userId, isAdmin, dto.promotionId);
    return PaymentResponseDto.fromEntity(payment);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook thanh toán',
    description: 'Endpoint nhận callback từ cổng thanh toán'
  })
  async webhook(@Body() body: any) {
    return { ok: true };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin thanh toán',
    description: 'Lấy thông tin chi tiết của một giao dịch thanh toán'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID thanh toán' })
  @ApiResponse({ status: 200, description: 'Thông tin thanh toán', type: PaymentResponseDto })
  async getPayment(@Param('id') id: string) {
    const payment = await this.svc.getPayment(Number(id));
    return PaymentResponseDto.fromEntity(payment);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Hoàn thành thanh toán (Tự động)',
    description: 'Đánh dấu thanh toán là hoàn thành hoặc thất bại. Endpoint này dùng cho webhook từ cổng thanh toán hoặc để tự động hoàn thành thanh toán. Nếu payment đã completed, sẽ không update lại để tránh duplicate.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID thanh toán (payment ID)' })
  @ApiBody({ 
    type: CompletePaymentDto,
    description: 'Thông tin để hoàn thành thanh toán'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Thanh toán đã được cập nhật thành công',
    type: PaymentResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Dữ liệu không hợp lệ' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Payment not found' 
  })
  async completePayment(
    @Param('id') id: string,
    @Body() dto: CompletePaymentDto
  ) {
    const payment = await this.svc.completePayment(Number(id), dto.transactionId, dto.success ?? true);
    return PaymentResponseDto.fromEntity(payment);
  }

  @Post(':id/vnpay/url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Tạo VNPAY payment URL',
    description: 'Tạo URL thanh toán VNPAY để redirect người dùng đến cổng thanh toán VNPAY'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID thanh toán (payment ID)' })
  @ApiBody({ type: CreateVnpayUrlDto })
  @ApiResponse({ 
    status: 200, 
    description: 'VNPAY payment URL đã được tạo thành công',
    type: VnpayUrlResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Lỗi: Payment không hợp lệ, không phải VNPAY method, hoặc đã completed' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Cần đăng nhập' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Không có quyền tạo payment cho booking này' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Payment not found' 
  })
  async createVnpayUrl(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateVnpayUrlDto,
  ) {
    try {
      const requester = req.user as any;
      const isAdmin = Array.isArray(requester?.roles) && requester.roles.includes('ROLE_ADMIN');
      const userId = requester?.id ?? requester?.sub;
      const ipAddr = this.vnpayService.getIpAddress(req);
      
      const paymentUrl = await this.svc.createVnpayPaymentUrl(
        Number(id),
        dto.returnUrl,
        ipAddr,
        userId,
        isAdmin,
      );

      return {
        paymentUrl,
        paymentId: Number(id),
      };
    } catch (error) {
      // Log error để debug
      console.error('Error creating VNPAY URL:', error);
      
      // Nếu là BadRequestException, trả về message rõ ràng hơn
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message || 'Không thể tạo VNPAY payment URL. Vui lòng kiểm tra cấu hình.');
      }
      
      // Re-throw các lỗi khác
      throw error;
    }
  }

  @Get('vnpay/return')
  @ApiOperation({
    summary: 'Xử lý return URL từ VNPAY',
    description: 'Endpoint nhận callback từ VNPAY sau khi thanh toán. Tự động redirect về frontend với kết quả thanh toán. Response code 00 = thành công, các mã khác = thất bại.'
  })
  @ApiQuery({ name: 'vnp_Amount', required: false, description: 'Số tiền (đã nhân 100, ví dụ: 1000000 = 10,000 VND)' })
  @ApiQuery({ name: 'vnp_BankCode', required: false, description: 'Mã ngân hàng' })
  @ApiQuery({ name: 'vnp_BankTranNo', required: false, description: 'Mã giao dịch ngân hàng' })
  @ApiQuery({ name: 'vnp_CardType', required: false, description: 'Loại thẻ' })
  @ApiQuery({ name: 'vnp_OrderInfo', required: false, description: 'Thông tin đơn hàng' })
  @ApiQuery({ name: 'vnp_PayDate', required: false, description: 'Ngày thanh toán (yyyyMMddHHmmss)' })
  @ApiQuery({ name: 'vnp_ResponseCode', required: false, description: 'Mã phản hồi: 00 = thành công, các mã khác = thất bại' })
  @ApiQuery({ name: 'vnp_TmnCode', required: false, description: 'Mã terminal VNPAY' })
  @ApiQuery({ name: 'vnp_TransactionNo', required: false, description: 'Mã giao dịch VNPAY' })
  @ApiQuery({ name: 'vnp_TransactionStatus', required: false, description: 'Trạng thái giao dịch' })
  @ApiQuery({ name: 'vnp_TxnRef', required: false, description: 'Mã tham chiếu (format: PAY{paymentId}_{timestamp})' })
  @ApiQuery({ name: 'vnp_SecureHash', required: false, description: 'Chữ ký bảo mật để verify callback' })
  @ApiResponse({ 
    status: 302, 
    description: 'Redirect về frontend: /payment-success?paymentId={id} (thành công) hoặc /payment-failure?paymentId={id}&code={code} (thất bại)' 
  })
  async handleVnpayReturn(
    @Query() query: any,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    try {
      // Verify signature
      const verifyResult = this.vnpayService.verifyReturnUrl(query);
      
      if (!verifyResult.isValid) {
        console.error('VNPAY return: Invalid signature', { query });
        return res.redirect(`${frontendUrl}/payment-failure?error=invalid_signature`);
      }

      // Parse order ID từ vnp_TxnRef (format: PAY{paymentId}_{timestamp})
      const txnRef = query.vnp_TxnRef || '';
      const paymentIdMatch = txnRef.match(/^PAY(\d+)_/);
      
      if (!paymentIdMatch) {
        console.error('VNPAY return: Invalid order format', { txnRef });
        return res.redirect(`${frontendUrl}/payment-failure?error=invalid_order`);
      }

      const paymentId = parseInt(paymentIdMatch[1], 10);
      const responseCode = verifyResult.responseCode;
      const transactionId = verifyResult.transactionId || query.vnp_TransactionNo;

      // Lấy payment để verify amount
      try {
        const payment = await this.svc.getPayment(paymentId);
        
        // Verify amount nếu có (tolerance 1 VND để tránh lỗi làm tròn)
        if (verifyResult.amount !== undefined && Math.abs(verifyResult.amount - Number(payment.amount)) > 1) {
          console.error('VNPAY return: Amount mismatch', { 
            expected: payment.amount, 
            received: verifyResult.amount 
          });
          return res.redirect(`${frontendUrl}/payment-failure?paymentId=${paymentId}&error=amount_mismatch`);
        }
      } catch (error) {
        console.error('VNPAY return: Payment not found', { paymentId, error });
        return res.redirect(`${frontendUrl}/payment-failure?error=payment_not_found`);
      }

      // Response code: 00 = thành công, các mã khác = thất bại
      const isSuccess = responseCode === '00';

      // Cập nhật payment status
      await this.svc.completePayment(
        paymentId,
        transactionId || `VNPAY_${Date.now()}`,
        isSuccess,
      );

      // Redirect đến frontend
      if (isSuccess) {
        return res.redirect(`${frontendUrl}/payment-success?paymentId=${paymentId}`);
      } else {
        return res.redirect(`${frontendUrl}/payment-failure?paymentId=${paymentId}&code=${responseCode}`);
      }
    } catch (error) {
      console.error('Error handling VNPAY return:', error);
      return res.redirect(`${frontendUrl}/payment-failure?error=server_error`);
    }
  }

  @Post('vnpay/webhook')
  @ApiOperation({
    summary: 'VNPAY IPN Webhook',
    description: 'Endpoint nhận IPN (Instant Payment Notification) từ VNPAY. VNPAY sẽ gửi POST request đến endpoint này để thông báo kết quả thanh toán. Phải trả về RspCode để VNPAY biết đã nhận được.'
  })
  @ApiBody({
    description: 'Thông tin callback từ VNPAY',
    schema: {
      type: 'object',
      properties: {
        vnp_Amount: { type: 'string', description: 'Số tiền (đã nhân 100)' },
        vnp_BankCode: { type: 'string', description: 'Mã ngân hàng' },
        vnp_BankTranNo: { type: 'string', description: 'Mã giao dịch ngân hàng' },
        vnp_CardType: { type: 'string', description: 'Loại thẻ' },
        vnp_OrderInfo: { type: 'string', description: 'Thông tin đơn hàng' },
        vnp_PayDate: { type: 'string', description: 'Ngày thanh toán' },
        vnp_ResponseCode: { type: 'string', description: 'Mã phản hồi: 00 = thành công' },
        vnp_TmnCode: { type: 'string', description: 'Mã terminal' },
        vnp_TransactionNo: { type: 'string', description: 'Mã giao dịch VNPAY' },
        vnp_TransactionStatus: { type: 'string', description: 'Trạng thái giao dịch' },
        vnp_TxnRef: { type: 'string', description: 'Mã tham chiếu (format: PAY{paymentId}_{timestamp})' },
        vnp_SecureHash: { type: 'string', description: 'Chữ ký bảo mật' },
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Kết quả xử lý webhook',
    type: VnpayWebhookResponseDto
  })
  async handleVnpayWebhook(@Body() body: any, @Req() req: any) {
    try {
      // Verify signature
      const verifyResult = this.vnpayService.verifyReturnUrl(body);
      
      if (!verifyResult.isValid) {
        console.error('VNPAY webhook: Invalid signature', { body });
        return { RspCode: '97', Message: 'Checksum failed' };
      }

      // Parse payment ID từ vnp_TxnRef
      const txnRef = body.vnp_TxnRef || '';
      const paymentIdMatch = txnRef.match(/^PAY(\d+)_/);
      
      if (!paymentIdMatch) {
        console.error('VNPAY webhook: Invalid order format', { txnRef });
        return { RspCode: '01', Message: 'Order not found' };
      }

      const paymentId = parseInt(paymentIdMatch[1], 10);
      const responseCode = verifyResult.responseCode;
      const transactionId = verifyResult.transactionId || body.vnp_TransactionNo;

      // Lấy payment để verify amount
      try {
        const payment = await this.svc.getPayment(paymentId);
        
        // Verify amount nếu có (tolerance 1 VND để tránh lỗi làm tròn)
        if (verifyResult.amount !== undefined && Math.abs(verifyResult.amount - Number(payment.amount)) > 1) {
          console.error('VNPAY webhook: Amount mismatch', { 
            paymentId,
            expected: payment.amount, 
            received: verifyResult.amount 
          });
          return { RspCode: '04', Message: 'Invalid amount' };
        }
      } catch (error) {
        console.error('VNPAY webhook: Payment not found', { paymentId, error });
        return { RspCode: '01', Message: 'Order not found' };
      }

      // Response code: 00 = thành công
      const isSuccess = responseCode === '00';

      // Cập nhật payment status
      await this.svc.completePayment(
        paymentId,
        transactionId || `VNPAY_${Date.now()}`,
        isSuccess,
      );

      return { RspCode: '00', Message: 'Success' };
    } catch (error) {
      console.error('Error handling VNPAY webhook:', error);
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }
}
