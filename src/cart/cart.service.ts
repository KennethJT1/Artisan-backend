// ...existing code...
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
// import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartRepository } from './cart.repository';
import { ProductsService } from '../products/products.service';
import { Types } from 'mongoose';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}

  async addMultipleToCart(
    userId: string,
    items: { productId: string; quantity: number }[],
  ) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items array must not be empty');
    }
    const userObjectId = new Types.ObjectId(userId);
    let cart = await this.cartRepository.findByUserId(userObjectId);
    if (!cart) {
      cart = await this.cartRepository.createCart(userObjectId);
    }
    for (const dto of items) {
      // Validate product
      const product = await this.productsService.findOne(dto.productId);
      if (!product)
        throw new NotFoundException(`Product not found: ${dto.productId}`);
      if (dto.quantity < 1)
        throw new BadRequestException('Quantity must be at least 1');
      // Check if item exists
      const idx = cart.items.findIndex(
        (item) => item.productId.toString() === dto.productId,
      );
      if (idx > -1) {
        // Merge quantity
        cart.items[idx].quantity += dto.quantity;
        cart.items[idx].totalPrice =
          cart.items[idx].unitPrice * cart.items[idx].quantity;
      } else {
        // Add new item with snapshot
        cart.items.push({
          productId: product._id as Types.ObjectId,
          name: (product as any).title,
          image: Array.isArray((product as any).images)
            ? (product as any).images[0] || ''
            : '',
          unitPrice: (product as any).price,
          quantity: dto.quantity,
          totalPrice: (product as any).price * dto.quantity,
        });
      }
    }
    await this.cartRepository.save(cart);
    const totals = this.calculateCartTotals(cart.items);
    return this.formatResponse(true, 'Items added to cart', {
      ...totals,
      items: cart.items,
    });
  }

  async getCart(userId: string) {
    const cart = await this.cartRepository.findByUserId(
      new Types.ObjectId(userId),
    );
    if (!cart) {
      return this.formatResponse(true, 'Cart is empty', {
        items: [],
        subtotal: 0,
        itemCount: 0,
      });
    }
    const totals = this.calculateCartTotals(cart.items);
    return this.formatResponse(true, 'Cart fetched', {
      ...totals,
      items: cart.items,
    });
  }

  // ...existing code...

  async removeFromCart(userId: string, productId: string) {
    const cart = await this.cartRepository.findByUserId(
      new Types.ObjectId(userId),
    );
    if (!cart) throw new NotFoundException('Cart not found');
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );
    await this.cartRepository.save(cart);
    const totals = this.calculateCartTotals(cart.items);
    return this.formatResponse(true, 'Item removed from cart', {
      ...totals,
      items: cart.items,
    });
  }

  async updateMultiple(userId: string, items: UpdateCartItemDto[]) {
    const cart = await this.cartRepository.findByUserId(
      new Types.ObjectId(userId),
    );
    if (!cart) throw new NotFoundException('Cart not found');

    for (const dto of items) {
      const idx = cart.items.findIndex(
        (item) => item.productId.toString() === dto.productId,
      );

      if (idx === -1) continue;

      if (dto.quantity < 1)
        throw new BadRequestException('Quantity must be at least 1');

      cart.items[idx].quantity = dto.quantity;
      cart.items[idx].totalPrice = cart.items[idx].unitPrice * dto.quantity;
    }

    await this.cartRepository.save(cart);

    const totals = this.calculateCartTotals(cart.items);

    return this.formatResponse(true, 'Cart updated', {
      ...totals,
      items: cart.items,
    });
  }

  async clearCart1(userId: string) {
    const cart = await this.cartRepository.findByUserId(
      new Types.ObjectId(userId),
    );
    if (!cart) throw new NotFoundException('Cart not found');
    cart.items = [];
    await this.cartRepository.save(cart);
    // Reload the cart from the database to ensure fresh state
    const freshCart = await this.cartRepository.findByUserId(
      new Types.ObjectId(userId),
    );
    return this.formatResponse(true, 'Cart cleared', {
      items: freshCart && freshCart.items ? freshCart.items : [],
      subtotal: 0,
      itemCount: 0,
    });
  }

  async clearCart(userId: string) {
  const userObjectId = new Types.ObjectId(userId);

  const updatedCart = await this.cartRepository['cartModel'].findOneAndUpdate(
    { user: userObjectId },
    { $set: { items: [] } },
    { new: true }
  );

  if (!updatedCart) throw new NotFoundException('Cart not found');

  return this.formatResponse(true, 'Cart cleared', {
    items: updatedCart.items,
    subtotal: 0,
    itemCount: 0,
  });
}

  calculateCartTotals(items: any[]) {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    );
    const itemCount = items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    );
    return { subtotal, itemCount };
  }

  formatResponse(success: boolean, message: string, data: any) {
    return { success, message, data };
  }
}
