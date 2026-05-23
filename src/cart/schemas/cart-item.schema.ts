import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class CartItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  currency: string;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
export type CartItemDocument = CartItem & Document;
