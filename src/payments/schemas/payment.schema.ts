import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  customer: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Artisan',
    required: true,
  })
  artisan: Types.ObjectId;

  @Prop({ required: true })
  service: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  time: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  duration: string;

  @Prop({ required: true })
  hourlyRate: number;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true })
  platformFee: number;

  @Prop({ required: true })
  tax: number;

  @Prop({ required: true })
  total: number;

  @Prop({
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
  })
  status: string;

  @Prop({
    required: true,
    enum: ['pending', 'paid', 'failed'],
  })
  paymentStatus: string;

  @Prop({
    required: true,
    enum: ['card', 'paypal', 'apple'],
  })
  paymentMethod: string;

  @Prop()
  transactionId: string;

  @Prop()
  rating: number;

  @Prop({
    enum: ['pending', 'processed', 'failed'],
    default: 'pending',
  })
  payoutStatus: string;

  @Prop()
  processedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
