import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { AddOrUpdateCartItemsDto } from './dto/cart-item.dto';
import { CartCouponDto } from './dto/cart-coupon.dto';

import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private readonly productsService: ProductsService,
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      cart = await this.cartModel.create({ userId, items: [] });
    }
    return this.formatCart(cart);
  }

  async addItems(userId: string, dto: AddOrUpdateCartItemsDto) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      cart = await this.cartModel.create({ userId, items: [] });
    }
    for (const item of dto.items) {
      const idx = cart.items.findIndex((i) => i.productId === item.productId);
      if (idx > -1) {
        cart.items[idx].quantity += item.quantity;
      } else {
        // Fetch product details
        const product = await this.productsService.findOne(item.productId);
        cart.items.push({
          productId: (product._id as any).toString(),
          title: product.title,
          price: product.price,
          image:
            Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : '',
          quantity: item.quantity,
          currency: 'USD', // Default, since Product has no currency field
        });
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
      const idx = cart.items.findIndex((i) => i.productId === item.productId);
      if (idx > -1) {
        cart.items[idx].quantity = item.quantity;
        // Optionally, fetch and update product details if needed
        const product = await this.productsService.findOne(item.productId);
        cart.items[idx].title = product.title;
        cart.items[idx].price = product.price;
        cart.items[idx].image =
          Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : '';
        cart.items[idx].currency = 'USD'; // Default, since Product has no currency field
      } else {
        // If item does not exist, add it
        const product = await this.productsService.findOne(item.productId);
        cart.items.push({
          productId: (product._id as any).toString(),
          title: product.title,
          price: product.price,
          image:
            Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : '',
          quantity: item.quantity,
          currency: 'USD',
        });
      }
    }
    this.calculateTotals(cart);
    await cart.save();
    return this.formatCart(cart);
  }

  async removeItem(userId: string, productId: string) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('Cart not found');
    cart.items = cart.items.filter((i) => i.productId !== productId);
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

  async setCart(userId: string, dto: AddOrUpdateCartItemsDto) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      cart = await this.cartModel.create({ userId, items: [] });
    }
    cart.items = [];
    for (const item of dto.items) {
      const product = await this.productsService.findOne(item.productId);
      cart.items.push({
        productId: (product._id as any).toString(),
        title: product.title,
        price: product.price,
        image:
          Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : '',
        quantity: item.quantity,
        currency: 'USD',
      });
    }
    this.calculateTotals(cart);
    await cart.save();
    return this.formatCart(cart);
  }

  private calculateTotals(cart: CartDocument) {
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    cart.tax = 0; // Tax excluded
    cart.shipping = 0; // Shipping excluded
    cart.grandTotal = cart.subtotal - (cart.discount || 0);
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
          grandTotal: cart.grandTotal,
          currency: cart.currency,
        },
      },
    };
  }
}
