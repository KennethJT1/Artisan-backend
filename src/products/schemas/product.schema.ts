import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Category } from 'src/category/schemas/category.schema';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Types.ObjectId | Category;

  @Prop({ required: true })
  price: number;

  @Prop()
  originalPrice: number;

  @Prop({
    required: true,
    enum: ['new', 'like new', 'good', 'fair', 'for parts', 'service'],
    default: 'new',
  })
  condition: string;

  @Prop()
  brand: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: 'Nigeria' })
  country: string;

  @Prop({
    type: {
      local: { type: Boolean, default: false },
      national: { type: Boolean, default: false },
      international: { type: Boolean, default: false },
      weight: { type: String, default: '' },
      dimensions: { type: String, default: '' },
    },
    default: {
      local: false,
      national: false,
      international: false,
      weight: '',
      dimensions: '',
    },
  })
  shipping: {
    local: boolean;
    national: boolean;
    international: boolean;
    weight: string;
    dimensions: string;
  };

  @Prop({ default: false })
  customization: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true, ref: 'User' })
  seller: string;

  @Prop({ default: 'active', enum: ['active', 'sold', 'pending'] })
  status: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
