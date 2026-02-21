import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  customerId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  artisanId: string;

  @Prop({ required: true }) service: string;
  @Prop({ required: true }) date: Date;
  @Prop({ required: true }) time: string;
  @Prop({ required: true }) duration: string;
  @Prop({ required: true }) amount: number;
  @Prop({ default: 0 }) commission: number;
  @Prop({ enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;
  @Prop() rating?: number;
  @Prop() review?: string;
  @Prop() location: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
