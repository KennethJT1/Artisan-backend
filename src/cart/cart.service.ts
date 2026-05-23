import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { CartItemDto, AddOrUpdateCartItemsDto } from './dto/cart-item.dto';
import { CartCouponDto } from './dto/cart-coupon.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      cart = await this.cartModel.create({ userId: new Types.ObjectId(userId), items: [] });
    }
    return this.formatCart(cart);
  }

  async addItems(userId: string, dto: AddOrUpdateCartItemsDto) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      cart = await this.cartModel.create({ userId: new Types.ObjectId(userId), items: [] });
    }
    for (const item of dto.items) {
      const idx = cart.items.findIndex(i => i.productId === item.productId);
      if (idx > -1) {
        cart.items[idx].quantity += item.quantity;
      } else {
        cart.items.push(item as any);
      }
    }
    this.calculateTotals(cart);
    await cart.save();
    return this.formatCart(cart);
  }

  async updateItems(userId: string, dto: AddOrUpdateCartItemsDto) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('Cart not found');
    for (const item of dto.items) {
      const idx = cart.items.findIndex(i => i.productId === item.productId);
      if (idx > -1) {
        cart.items[idx].quantity = item.quantity;
        cart.items[idx].price = item.price;
        cart.items[idx].title = item.title;
        cart.items[idx].image = item.image;
        cart.items[idx].currency = item.currency;
      }
    }
    this.calculateTotals(cart);
    await cart.save();
    return this.formatCart(cart);
  }

  async removeItem(userId: string, productId: string) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('Cart not found');
    cart.items = cart.items.filter(i => i.productId !== productId);
    this.calculateTotals(cart);
    await cart.save();
    return this.formatCart(cart);
  }

  async clearCart(userId: string) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('Cart not found');
    cart.items = [];
    cart.couponCode = null;
    this.calculateTotals(cart);
    await cart.save();
    return this.formatCart(cart);
  }

  async applyCoupon(userId: string, dto: CartCouponDto) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('Cart not found');
    cart.couponCode = dto.couponCode;
    // For demo, apply a flat 10% discount for any coupon
    cart.discount = cart.subtotal * 0.1;
    this.calculateTotals(cart);
    await cart.save();
    return this.formatCart(cart);
  }

  async removeCoupon(userId: string) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('Cart not found');
    cart.couponCode = null;
    cart.discount = 0;
    this.calculateTotals(cart);
    await cart.save();
    return this.formatCart(cart);
  }

  private calculateTotals(cart: CartDocument) {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.tax = cart.subtotal * 0.05; // 5% tax
    cart.shipping = cart.items.length > 0 ? 10 : 0; // Flat shipping
    cart.grandTotal = cart.subtotal - (cart.discount || 0) + cart.tax + cart.shipping;
    cart.currency = cart.items[0]?.currency || 'USD';
  }

  private formatCart(cart: CartDocument) {
    return {
      data: {
        _id: cart._id,
        items: cart.items,
        totals: {
          subtotal: cart.subtotal,
          discount: cart.discount,
          tax: cart.tax,
          shipping: cart.shipping,
          grandTotal: cart.grandTotal,
          currency: cart.currency,
        },
      },
    };
  }
}
