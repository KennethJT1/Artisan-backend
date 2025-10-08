import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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
  @Prop({ default: 'pending' }) status: string; // pending, confirmed, completed, cancelled
  @Prop() rating?: number;
  @Prop() review?: string;
  @Prop() location: string;
}