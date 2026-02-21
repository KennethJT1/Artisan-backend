import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  constructor(@InjectModel(Payment.name) private paymentModel: Model<any>) {}

  async create(data: Partial<Payment>) {
    return this.paymentModel.create(data);
  }

  async findOne(id: string) {
    return this.paymentModel.findById(id);
  }

  async getPaymentHistoryByCustomer(customerId: string) {
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
      .lean();

    // Shape the response to match what frontend expects
    return payments.map((p: any) => ({
      _id: p._id,
      artisan: p.artisan?.user
        ? `${p.artisan.user.firstName} ${p.artisan.user.lastName}`
        : 'Unknown Artisan',
      amount: p.total,
      date: p.createdAt.toISOString(),
      status: p.paymentStatus, // or p.status if you prefer
    }));
  }
}
