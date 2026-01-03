import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Artisan } from 'src/artisans/schemas/artisan.schema';

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

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop() phone?: string;

  // Customer-only
  @Prop() address?: string;

  // Auth / system
  @Prop() resetToken?: string;
  @Prop() resetTokenExpiry?: Date;

  // Meta
  @Prop({ default: 'free' })
  plan: string;

  @Prop({ type: Types.ObjectId, ref: 'Artisan' })
  artisanProfile: Types.ObjectId | any;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
