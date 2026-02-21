import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Artisan } from 'src/artisans/schemas/artisan.schema';

export type UserDocument = User & Document;

export enum UserRole {
  CUSTOMER = 'customer',
  ARTISAN = 'artisan',
  ADMIN = 'admin',
}

export interface PaymentMethod {
  _id: Types.ObjectId;
  type: string;          
  brand?: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  stripePaymentMethodId?: string;
  createdAt: Date;
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

@Prop({
    type: [
      {
        _id:        { type: Types.ObjectId, auto: true },
        type:       { type: String, required: true },
        brand:      { type: String, default: 'unknown' },
        last4:      { type: String, required: true },
        expMonth:   Number,
        expYear:    Number,
        isDefault:  { type: Boolean, default: false },
        stripePaymentMethodId: String,
        createdAt:  { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  paymentMethods: PaymentMethod[];

  // Meta
  @Prop({ default: 'free' })
  plan: string;

  @Prop({ type: Types.ObjectId, ref: 'Artisan' })
  artisanProfile: Types.ObjectId | any;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
