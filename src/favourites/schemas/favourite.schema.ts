import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FavouritesDocument = Favourite & Document;

@Schema({ timestamps: true })
export class Favourite {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Artisan', required: true })
  artisan: Types.ObjectId;

  @Prop({ default: Date.now })
  addedAt: Date;
}

export const FavouriteSchema = SchemaFactory.createForClass(Favourite);
FavouriteSchema.index({ customer: 1, artisan: 1 }, { unique: true });