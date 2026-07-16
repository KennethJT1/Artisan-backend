import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Payment } from './schemas/payment.schema';
import { PaymentsService } from './payments.service';
import { InitiatePaystackPaymentDto } from './dto/initiate-paystack-payment.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SUBSCRIPTION_PLANS } from './constants/subscription-plans';

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

  // (Optional) fallback create
  @Post()
  async create(@Body() data: Partial<Payment>) {
    return this.paymentsService.create(data);
  }

  // === NEW STRIPE SUBSCRIPTION ENDPOINTS ===
  @Get('plans')
  getPlans() {
    const planList = Object.entries(SUBSCRIPTION_PLANS).map(([key, value]) => ({
      id: key,
      name: value.name,
      description: `${value.name} plan for sellers`,
      monthlyPrice: 'price' in value ? value.price : 0,
      yearlyPrice: 'price' in value ? Math.round(value.price * 12 * 0.8) : 0,
      maxProducts: 'maxProducts' in value ? value.maxProducts : 0,
      commission: value.commission,
      features: 'features' in value ? value.features : [],
      popular: key === 'intermediate',
    }));
    return planList;
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  async subscribe(
    @Req() req,
    @Body() body: { plan: string; billingCycle: 'monthly' | 'yearly' },
  ) {
    return this.paymentsService.createSubscription(
      req.user.id,
      body.plan,
      body.billingCycle,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  async getSubscription(@Req() req) {
    return this.paymentsService.getUserSubscription(req.user.id);
  }

  @Get('verify-subscription')
async verifySubscription(@Query('session_id') sessionId: string) {
  return this.paymentsService.verifyStripeSession(sessionId);
}
  // (Optional) fallback findOne
  @Get('by-id/:id')
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  // Get payment status by orderId
  @Get(':orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId);
  }
}
