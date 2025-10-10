import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Category } from 'src/category/schemas/category.schema';

export type ArtisanDocument = Artisan & Document;

@Schema({ timestamps: true })
export class Artisan {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Types.ObjectId | Category;

  @Prop({ required: true, enum: ['1-2', '3-5', '6-10', '10+'] })
  experience: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  hourlyRate: number;

  @Prop({ required: true })
  location: string;

  @Prop({
    type: [String],
    default: [],
    validate: [
      /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
      'Portfolio item must be a valid image URL',
    ],
  })
  portfolio: string[];

  @Prop({
    type: [String],
    default: [],
    validate: [
      /^https?:\/\/.+\.(jpg|jpeg|png|gif|pdf|webp)$/i,
      'Certification must be a valid image or PDF URL',
    ],
  })
  certifications: string[];

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status: string;
}

export const ArtisanSchema = SchemaFactory.createForClass(Artisan);
