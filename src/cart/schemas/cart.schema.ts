import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CartItem, CartItemSchema } from './cart-item.schema';

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ type: Number, default: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ type: Number, default: 0 })
  total: number;

  @Prop({ type: String, default: null })
  couponCode: string;

  @Prop({ type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
  expiresAt: Date;

  @Prop({ type: Date, default: Date.now })
  lastModified: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
