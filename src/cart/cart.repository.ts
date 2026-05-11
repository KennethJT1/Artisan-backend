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

  async clearCart(userId: Types.ObjectId) {
    return this.cartModel.findOneAndUpdate(
      { user: userId },
      { 
        $set: { 
          items: [], 
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
          couponCode: null,
          lastModified: new Date(),
        } 
      },
      { new: true },
    );
  }

  async findAbandonedCarts(days: number = 7) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.cartModel.find({
      lastModified: { $lt: date },
      items: { $ne: [] },
    }).exec();
  }

  async deleteExpiredCarts() {
    return this.cartModel.deleteMany({
      expiresAt: { $lt: new Date() },
    }).exec();
  }

  async updateCartTotals(userId: Types.ObjectId, totals: any) {
    return this.cartModel.findOneAndUpdate(
      { user: userId },
      { 
        $set: { 
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total,
          lastModified: new Date(),
        } 
      },
      { new: true },
    );
  }
}
