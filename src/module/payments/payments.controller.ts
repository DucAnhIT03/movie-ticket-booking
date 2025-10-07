import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Post()
  create(@Body() body: { bookingId: number; method: string; amount: number }) {
    return this.svc.createPayment(body.bookingId, body.method, body.amount);
  }

  // Example endpoint for webhook (simplified)
  @Post('webhook')
  async webhook(@Body() body: any) {
    // map provider payload -> completePayment
    // this is provider-specific, implement accordingly
    return { ok: true };
  }
}
