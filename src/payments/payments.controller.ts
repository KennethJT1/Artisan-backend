
import { Controller, Post, Body, Get, Param, Req } from '@nestjs/common';
import { Payment } from './schemas/payment.schema';
import { PaymentsService } from './payments.service';
import { InitiatePaystackPaymentDto } from './dto/initiate-paystack-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Initiate Paystack payment
  @Post('paystack/initiate')
  async initiatePaystack(@Body() dto: InitiatePaystackPaymentDto) {
    return this.paymentsService.initiatePaystackPayment(dto);
  }

  // Paystack webhook
  @Post('webhook')
  async paystackWebhook(@Req() req) {
    return this.paymentsService.handlePaystackWebhook(req.body);
  }

  // Get payment status by orderId
  @Get(':orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId);
  }

  // (Optional) fallback create
  @Post()
  async create(@Body() data: Partial<Payment>) {
    return this.paymentsService.create(data);
  }

  // (Optional) fallback findOne
  @Get('by-id/:id')
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
