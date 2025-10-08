import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: '2025-02-11',
});

@Controller('stripe')
export class StripeController {
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: Request, @Headers('stripe-signature') sig: string) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('✅ Checkout session completed');
        break;

      case 'payment_intent.succeeded':
        console.log('💰 Payment succeeded');
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}


export const SUBSCRIPTION_PLANS = {
  free: { name: 'Free', commission: 0.15, features: [] },
  beginner: { name: 'Beginner', price: 9, commission: 0.05, maxProducts: 10 },
  intermediate: { name: 'Intermediate', price: 29, commission: 0.03, maxProducts: 50 },
  advanced: { name: 'Advanced', price: 79, commission: 0.01, maxProducts: -1 },
};