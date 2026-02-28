import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ArtisanDocument } from 'src/artisans/schemas/artisan.schema';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId | any;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Artisan', required: true })
  artisanId: Types.ObjectId | any;

  @Prop({ required: true }) service: string;
  @Prop({ required: true }) date: Date;
  @Prop({ required: true }) time: string;
  @Prop({ required: true }) duration: number;
  @Prop({ required: true }) amount: number;
  @Prop({ default: 0 }) commission: number;
  @Prop({ enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;
  @Prop() rating?: number;
  @Prop() review?: string;
  @Prop({ default: false })
  isDeleted?: boolean;
  @Prop() location: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
