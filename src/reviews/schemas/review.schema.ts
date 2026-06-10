
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reviewerId: Types.ObjectId;

  @Prop({ type: String, required: true })
  reviewerName: string;

  @Prop({ type: Types.ObjectId, ref: 'Artisan', required: false, index: true })
  artisanId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: false, index: true })
  productId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  rating: number;

  @Prop({ type: String, maxlength: 2000 })
  comment: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true })
  status: 'pending' | 'approved' | 'rejected';

  @Prop({ type: Boolean, default: false, index: true })
  reported: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ artisanId: 1, productId: 1, orderId: 1, reviewerId: 1 }, { unique: true });
ReviewSchema.index({ status: 1, reported: 1 });

