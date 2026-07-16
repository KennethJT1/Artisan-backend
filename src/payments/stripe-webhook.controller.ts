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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

@Controller('stripe')
export class StripeController {
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') sig: string,
  ) {
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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.userId && session.metadata?.plan) {
          console.log(
            `✅ Subscription successful for user ${session.metadata.userId} → ${session.metadata.plan}`,
          );
          // TODO: Inject UsersService and update user.plan + subscriptionId
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        console.log(`Subscription status changed: ${event.type}`);
        break;
      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return { received: true };
  }
}
