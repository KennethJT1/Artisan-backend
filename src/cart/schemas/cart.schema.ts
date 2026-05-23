import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CartItem, CartItemSchema } from './cart-item.schema';

@Schema()
export class Cart {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: 0 })
  shipping: number;

  @Prop({ default: 0 })
  grandTotal: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ type: String, default: null })
  couponCode: string | null;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
export type CartDocument = Cart & Document;
