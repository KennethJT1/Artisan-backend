import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from './schemas/cart.schema';

@Injectable()
export class CartRepository {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,
  ) {}

  findByUserId(userId: Types.ObjectId) {
    return this.cartModel.findOne({ user: userId }).exec();
  }

  async createCart(userId: Types.ObjectId) {
    return this.cartModel.create({ user: userId, items: [] });
  }

  async save(cart: any) {
    return cart.save();
  }
}
