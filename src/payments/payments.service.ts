import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  constructor(@InjectModel(Payment.name) private paymentModel: Model<Payment>) {}

  async create(data: Partial<Payment>) {
    return this.paymentModel.create(data);
  }

  async findOne(id: string) {
    return this.paymentModel.findById(id);
  }
}
