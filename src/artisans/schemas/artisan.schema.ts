import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop({ required: true, enum: ['Carpentry', 'Painting', 'Plumbing', 'Electrical', 'Landscaping', 'Interior Design', 'Masonry', 'Roofing', 'Flooring', 'HVAC', 'Other'] })
  category: string;

  @Prop({ required: true, enum: ['1-2', '3-5', '6-10', '10+'] })
  experience: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  hourlyRate: number;

  @Prop({ required: true })
  location: string;

  @Prop({ type: [String], default: [] })
  portfolio: string[];

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @Prop({ required: true, ref: 'User' })
  user: string;
}

export const ArtisanSchema = SchemaFactory.createForClass(Artisan);