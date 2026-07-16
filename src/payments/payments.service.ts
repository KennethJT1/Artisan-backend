// (stray code removed)
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import {
  OrderLean,
  PaymentLean,
} from './interfaces/payment-order-lean.interface';
import { InjectModel as InjectOrderModel } from '@nestjs/mongoose';
import { Order } from '../orders/schemas/order.schema';
import { InitiatePaystackPaymentDto } from './dto/initiate-paystack-payment.dto';
import axios from 'axios';
import { SUBSCRIPTION_PLANS } from './constants/subscription-plans';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import Stripe from 'stripe';

// const PRICE_IDS = {
//   beginner: {
//     monthly: process.env.STRIPE_BEGINNER_MONTHLY!,
//     yearly: process.env.STRIPE_BEGINNER_YEARLY!,
//   },
//   intermediate: {
//     monthly: process.env.STRIPE_INTERMEDIATE_MONTHLY!,
//     yearly: process.env.STRIPE_INTERMEDIATE_YEARLY!,
//   },
//   advanced: {
//     monthly: process.env.STRIPE_ADVANCED_MONTHLY!,
//     yearly: process.env.STRIPE_ADVANCED_YEARLY!,
//   },
// } as const;

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectOrderModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // Initiate Paystack payment
  async initiatePaystackPayment(dto: InitiatePaystackPaymentDto) {
    // Prevent duplicate payment for same order if already paid
    const existingPayment = await this.paymentModel.findOne({
      orderId: dto.orderId,
    });
    if (existingPayment && existingPayment.paymentStatus === 'success') {
      throw new BadRequestException(
        'Payment for this order has already been completed.',
      );
    }
    // Integrate with Paystack API
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    const PAYSTACK_BASE_URL =
      process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
    try {
      // Fetch the order to get all required fields for Payment
      const order = (await this.orderModel
        .findById(dto.orderId)
        .lean()) as OrderLean | null;
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      // Type guard for order.items
      const firstItem =
        Array.isArray(order.items) && order.items.length > 0
          ? order.items[0]
          : undefined;
      const response = await axios.post<{
        data: { reference: string; authorization_url: string };
      }>(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email: dto.email,
          amount: Math.round(dto.amount * 100), // Paystack expects amount in kobo
          reference: `${dto.orderId}-${Date.now()}`,
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const { reference, authorization_url } = response.data.data;
      // Create a Payment record in DB with all required fields
      // Use current date/time for required fields
      const now = new Date();
      await this.paymentModel.create({
        orderId: dto.orderId,
        transactionId: reference,
        paymentStatus: 'pending',
        paymentMethod: 'paystack',
        total: order.totals?.grandTotal ?? 0,
        tax: order.totals?.tax ?? 0,
        platformFee: order.totals?.shipping ?? 0,
        subtotal: order.totals?.subtotal ?? 0,
        hourlyRate:
          firstItem && typeof firstItem.price === 'number'
            ? firstItem.price
            : 0,
        duration:
          firstItem && typeof firstItem.quantity === 'number'
            ? String(firstItem.quantity)
            : '1',
        location: order.shippingAddress?.city ?? '',
        time: now.toTimeString().slice(0, 5),
        date: now.toISOString().slice(0, 10),
        service:
          firstItem && typeof firstItem.title === 'string'
            ? firstItem.title
            : '',
        artisan:
          firstItem && typeof firstItem.productId === 'string'
            ? firstItem.productId
            : null,
        customer: order.userId ?? '',
        status: 'pending',
      });
      return {
        paystackReference: reference,
        paymentUrl: authorization_url,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Paystack initiation failed',
        error?.response?.data || error.message,
      );
    }
  }

  // Handle Paystack webhook
  async handlePaystackWebhook(payload: unknown) {
    console.log('payload:', payload);
    function isPaystackWebhook(
      obj: any,
    ): obj is { data: { reference: string; status: string } } {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.data === 'object' &&
        obj.data !== null &&
        typeof obj.data.reference === 'string' &&
        typeof obj.data.status === 'string'
      );
    }
    if (!isPaystackWebhook(payload)) {
      return { success: false, error: 'Invalid webhook payload' };
    }
    const { reference, status } = payload.data;
    // Find payment by reference and update status
    const payment = await this.paymentModel
      .findOneAndUpdate(
        { transactionId: reference },
        status === 'success'
          ? { paymentStatus: status, status: 'completed' }
          : { paymentStatus: status },
        { new: true },
      )
      .lean<PaymentLean | null>();
    // If payment is successful, update the related order status to 'paid'
    if (payment && status === 'success' && payment.orderId) {
      await this.orderModel.findOneAndUpdate(
        { _id: payment.orderId },
        { status: 'paid' },
      );
    }
    return { success: !!payment };
  }

  // Get payment status by orderId
  async getPaymentStatus(orderId: string) {
    // Lookup payment by orderId and return status
    const payment = await this.paymentModel
      .findOne({ orderId })
      .lean<PaymentLean | null>();
    if (!payment) throw new NotFoundException('Payment not found');
    return {
      orderId: payment.orderId,
      userId: payment.customer?.toString?.() ?? String(payment.customer),
      method: payment.paymentMethod,
      status: payment.paymentStatus,
      paystackReference: payment.transactionId,
      amount: payment.total,
    };
  }

  async create(data: Partial<Payment>) {
    return this.paymentModel.create(data);
  }

  async findOne(id: string) {
    return this.paymentModel.findById(id);
  }

  async getPaymentHistoryByCustomer(customerId: string) {
    type PopulatedArtisan = {
      user?: { firstName?: string; lastName?: string };
    };
    type PopulatedPayment = PaymentLean & {
      _id: string;
      artisan?: PopulatedArtisan;
      createdAt?: Date;
    };
    const payments = await this.paymentModel
      .find({ customer: customerId })
      .populate({
        path: 'artisan',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName',
        },
      })
      .sort({ createdAt: -1 })
      .lean<PopulatedPayment[]>();

    // Shape the response to match what frontend expects
    return payments.map((p) => ({
      _id: p._id,
      artisan:
        p.artisan &&
        p.artisan.user &&
        p.artisan.user.firstName &&
        p.artisan.user.lastName
          ? `${p.artisan.user.firstName} ${p.artisan.user.lastName}`
          : 'Unknown Artisan',
      amount: p.total,
      date:
        p.createdAt instanceof Date
          ? p.createdAt.toISOString()
          : String(p.createdAt),
      status: p.paymentStatus, // or p.status if you prefer
    }));
  }

  // === STRIPE SUBSCRIPTION METHODS ===
  async createSubscription(
    userId: string,
    planKey: string,
    billingCycle: 'monthly' | 'yearly',
  ) {
    const planData =
      SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];
    if (!planData || !planData.price) {
      throw new BadRequestException('Invalid subscription plan');
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.userModel.updateOne(
        { _id: userId },
        { $set: { stripeCustomerId: customerId } },
      );
    }

    const PRICE_IDS = {
      beginner: {
        monthly: process.env.STRIPE_BEGINNER_MONTHLY!,
        yearly: process.env.STRIPE_BEGINNER_YEARLY!,
      },
      intermediate: {
        monthly: process.env.STRIPE_INTERMEDIATE_MONTHLY!,
        yearly: process.env.STRIPE_INTERMEDIATE_YEARLY!,
      },
      advanced: {
        monthly: process.env.STRIPE_ADVANCED_MONTHLY!,
        yearly: process.env.STRIPE_ADVANCED_YEARLY!,
      },
    };
    const priceId = PRICE_IDS[planKey]?.[billingCycle];

    if (!priceId) {
      throw new BadRequestException('Invalid subscription plan.');
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription`,
      metadata: { userId, plan: planKey, billingCycle },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  // async getUserSubscription(userId: string) {
  //   const user = await this.userModel
  //     .findById(userId)
  //     .select('plan stripeCustomerId');
  //   return {
  //     plan: user?.plan || 'free',
  //     stripeCustomerId: user?.stripeCustomerId,
  //   };
  // }

  async getUserSubscription(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeCustomerId) {
      return {
        plan: 'free',
        subscribed: false,
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 1,
    });

    if (!subscriptions.data.length) {
      return {
        plan: user.plan ?? 'free',
        subscribed: false,
        stripeCustomerId: user.stripeCustomerId,
      };
    }

    const subscription = subscriptions.data[0];

    return {
      plan: user.plan,
      stripeCustomerId: user.stripeCustomerId,

      subscriptionId: subscription.id,
      status: subscription.status,

      currentPeriodStart: subscription.items.data[0]?.current_period_start,

      currentPeriodEnd: subscription.items.data[0]?.current_period_end,

      cancelAtPeriodEnd: subscription.cancel_at_period_end,

      currency: subscription.currency,

      amount: subscription.items.data[0]?.price.unit_amount,

      interval: subscription.items.data[0]?.price.recurring?.interval,

      priceId: subscription.items.data[0]?.price.id,

      productId: subscription.items.data[0]?.price.product,
    };
  }

  async verifyStripeSession(sessionId: string) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.metadata?.userId) {
      // Update user plan in DB
      await this.userModel.updateOne(
        { _id: session.metadata.userId },
        { plan: session.metadata.plan || 'advanced' },
      );
      return { success: true, plan: session.metadata.plan };
    }

    return { success: true };
  }
}
