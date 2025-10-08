import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CUSTOMER = 'customer',
  ARTISAN = 'artisan',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop() phone: string;
  @Prop() address: string;
  @Prop() location: string; 

  // Artisan-specific
  @Prop() category?: string;
  @Prop() hourlyRate?: number;
  @Prop() bio?: string;
  @Prop([String]) skills?: string[];
  @Prop() isApproved?: boolean;

  // Subscription
  @Prop({ default: 'free' }) // 'free', 'beginner', 'intermediate', 'advanced'
  plan: string;
}

export const UserSchema = SchemaFactory.createForClass(User);