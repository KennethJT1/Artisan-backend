import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: string;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  rating: number;

  @Prop({ type: String, maxlength: 1000 })
  comment: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Boolean, default: false, index: true })
  isApproved: boolean;
}

export type ReviewDocument = Review & Document;
export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes for efficient queries
ReviewSchema.index({ productId: 1, isDeleted: 1, isApproved: 1 });
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
