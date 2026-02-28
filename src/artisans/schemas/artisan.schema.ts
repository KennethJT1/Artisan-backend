import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Category } from 'src/category/schemas/category.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';

export type ArtisanDocument = Artisan & Document;

@Schema({ timestamps: true })
export class Artisan {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  user: Types.ObjectId | UserDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Category.name,
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

  // ✅ NEW FIELDS FOR FRONTEND
  @Prop({ type: [String], default: [] })
  skills: string[]; // ← Missing

  @Prop({ default: 0 })
  completionRate: number; // ← Missing

  @Prop({ default: '24h' })
  responseTime: string; // ← Missing

  @Prop({ default: 0 })
  profileViews: number; // ← Missing

  @Prop({ default: true })
  isAvailable: boolean; // ← Missing

  @Prop({ type: [String], default: [] })
  portfolio: string[];

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({
    default: 'pending',
    enum: ['pending', 'approved', 'rejected'],
  })
  status: string;

  @Prop({ type: Number, default: 0.1 })
  commissionRate: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ArtisanSchema = SchemaFactory.createForClass(Artisan);
