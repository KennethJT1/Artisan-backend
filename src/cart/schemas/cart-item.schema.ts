import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ type: String, default: null })
  sku: string;

  @Prop({ type: Object, default: {} })
  variant: any;

  @Prop({ type: Number, default: 0 })
  stock: number;

  @Prop({ type: Boolean, default: true })
  isAvailable: boolean;

  @Prop({ type: Date, default: Date.now })
  addedAt: Date;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
