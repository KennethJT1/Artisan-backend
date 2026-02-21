import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewsDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Artisan', required: true })
  artisan: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  booking?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true })
  comment: string;

  @Prop({ required: true })
  service: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
