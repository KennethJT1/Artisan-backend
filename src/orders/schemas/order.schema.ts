import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CartItemSchema } from '../../cart/schemas/cart-item.schema';

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: Object, required: true })
  contactInfo: any;

  @Prop({ type: Object, required: true })
  shippingAddress: any;

  @Prop({ type: [CartItemSchema], required: true })
  items: any[];

  @Prop({
    type: {
      subtotal: { type: Number, required: true },
      discount: { type: Number, required: true },
      tax: { type: Number, required: true },
      shipping: { type: Number, required: true },
      grandTotal: { type: Number, required: true },
      currency: { type: String, required: true },
    },
    required: true,
  })
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    grandTotal: number;
    currency: string;
  };

  @Prop({ type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' })
  status: string;

  @Prop({ type: String, enum: ['paystack'], required: true })
  paymentMethod: string;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId: Types.ObjectId;
}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);
