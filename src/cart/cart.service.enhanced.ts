import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartRepository } from './cart.repository';
import { ProductsService } from '../products/products.service';
import { Types } from 'mongoose';

// Constants
const MAX_ITEMS_PER_CART = 100;
const MAX_QUANTITY_PER_ITEM = 999;
const TAX_RATE = 0.05; // 5% - adjust based on region
const CART_EXPIRATION_DAYS = 30;

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Add multiple items to cart with comprehensive validation
   */
  async addMultipleToCart(
    userId: string,
    items: { productId: string; quantity: number; variant?: any }[],
  ) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items array must not be empty');
    }

    const userObjectId = new Types.ObjectId(userId);
    let cart = await this.cartRepository.findByUserId(userObjectId);

    if (!cart) {
      cart = await this.cartRepository.createCart(userObjectId);
    }

    // Validate total items won't exceed limit
    const existingItemCount = cart.items.length;
    if (existingItemCount + items.length > MAX_ITEMS_PER_CART) {
      throw new BadRequestException(
        `Cart cannot exceed ${MAX_ITEMS_PER_CART} items. Current: ${existingItemCount}`,
      );
    }

    for (const dto of items) {
      // Validate product exists and is active
      const product = await this.productsService.findOne(dto.productId);
      if (!product) {
        throw new NotFoundException(`Product not found: ${dto.productId}`);
      }

      // Check if product is still available
      const isAvailable = await this.isProductAvailable(product);
      if (!isAvailable) {
        throw new ConflictException(
          `Product "${(product as any).title || (product as any).name}" is no longer available`,
        );
      }

      // Validate quantity
      if (dto.quantity < 1 || dto.quantity > MAX_QUANTITY_PER_ITEM) {
        throw new BadRequestException(
          `Quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM}`,
        );
      }

      // Check stock availability
      const availableStock = (product as any).stock || 0;
      if (dto.quantity > availableStock) {
        throw new ConflictException(
          `Insufficient stock for "${(product as any).title || (product as any).name}". Available: ${availableStock}`,
        );
      }

      // Check if item already exists (accounting for variants)
      const existingIdx = cart.items.findIndex(
        (item) =>
          item.productId.toString() === dto.productId &&
          JSON.stringify(item.variant) === JSON.stringify(dto.variant || {}),
      );

      if (existingIdx > -1) {
        // Merge quantity
        const newQuantity = cart.items[existingIdx].quantity + dto.quantity;
        if (newQuantity > availableStock) {
          throw new ConflictException(
            `Cannot add that quantity. Max available: ${availableStock}, Total in cart would be: ${newQuantity}`,
          );
        }
        cart.items[existingIdx].quantity = newQuantity;
        cart.items[existingIdx].totalPrice =
          cart.items[existingIdx].unitPrice * newQuantity;
      } else {
        // Add new item
        cart.items.push({
          productId: product._id as Types.ObjectId,
          name: (product as any).title || (product as any).name,
          image: Array.isArray((product as any).images)
            ? (product as any).images[0] || ''
            : (product as any).image || '',
          unitPrice: (product as any).price,
          discount: (product as any).discount || 0,
          quantity: dto.quantity,
          totalPrice: (product as any).price * dto.quantity,
          sku: (product as any).sku || null,
          variant: dto.variant || {},
          stock: availableStock,
          isAvailable: true,
          addedAt: new Date(),
        });
      }
    }

    // Save and calculate totals
    await this.cartRepository.save(cart);
    const totals = this.calculateCartTotals(cart.items);
    await this.cartRepository.updateCartTotals(userObjectId, totals);

    this.logger.log(
      `Added ${items.length} item(s) to cart for user ${userId}`,
    );

    return this.formatResponse(true, 'Items added to cart', {
      ...totals,
      items: cart.items,
    });
  }

  /**
   * Get cart with validation and refresh of product availability
   */
  async getCart(userId: string) {
    const cart = await this.cartRepository.findByUserId(
      new Types.ObjectId(userId),
    );

    if (!cart || cart.items.length === 0) {
      return this.formatResponse(true, 'Cart is empty', {
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        couponCode: null,
        itemCount: 0,
      });
    }

    // Validate and refresh item availability
    await this.validateCartItems(cart);

    // Recalculate totals in case prices changed
    const totals = this.calculateCartTotals(cart.items);

    return this.formatResponse(true, 'Cart fetched', {
      ...totals,
      items: cart.items,
    });
  }

  /**
   * Remove single item from cart
   */
  async removeFromCart(userId: string, productId: string) {
    const cart = await this.cartRepository.findByUserId(
      new Types.ObjectId(userId),
    );

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );

    if (cart.items.length === initialLength) {
      throw new NotFoundException(
        `Product ${productId} not found in cart`,
      );
    }

    await this.cartRepository.save(cart);
    const totals = this.calculateCartTotals(cart.items);

    this.logger.log(`Removed product ${productId} from cart for user ${userId}`);

    return this.formatResponse(true, 'Item removed from cart', {
      ...totals,
      items: cart.items,
    });
  }

  /**
   * Update multiple cart items with validation
   */
  async updateMultiple(userId: string, items: UpdateCartItemDto[]) {
    const cart = await this.cartRepository.findByUserId(
      new Types.ObjectId(userId),
    );

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    for (const dto of items) {
      const idx = cart.items.findIndex(
        (item) => item.productId.toString() === dto.productId,
      );

      if (idx === -1) continue;

      // Validate quantity
      if (dto.quantity < 1 || dto.quantity > MAX_QUANTITY_PER_ITEM) {
        throw new BadRequestException(
          `Quantity for product ${dto.productId} must be between 1 and ${MAX_QUANTITY_PER_ITEM}`,
        );
      }

      // Check max quantity if provided
      if (
        dto.maxQuantity &&
        dto.quantity > dto.maxQuantity
      ) {
        throw new ConflictException(
          `Quantity exceeds available stock. Max: ${dto.maxQuantity}`,
        );
      }

      cart.items[idx].quantity = dto.quantity;
      cart.items[idx].totalPrice =
        cart.items[idx].unitPrice * dto.quantity;
    }

    await this.cartRepository.save(cart);
    const totals = this.calculateCartTotals(cart.items);

    this.logger.log(
      `Updated ${items.length} item(s) in cart for user ${userId}`,
    );

    return this.formatResponse(true, 'Cart updated', {
      ...totals,
      items: cart.items,
    });
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string) {
    const updatedCart = await this.cartRepository.clearCart(
      new Types.ObjectId(userId),
    );

    if (!updatedCart) {
      throw new NotFoundException('Cart not found');
    }

    this.logger.log(`Cleared cart for user ${userId}`);

    return this.formatResponse(true, 'Cart cleared', {
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      couponCode: null,
      itemCount: 0,
    });
  }

  /**
   * Apply coupon code (stub - implement based on your coupon service)
   */
  async applyCoupon(userId: string, couponCode: string) {
    const cart = await this.cartRepository.findByUserId(
      new Types.ObjectId(userId),
    );

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // TODO: Validate coupon with CouponService
    // const coupon = await this.couponService.validate(couponCode);
    // Placeholder for now
    const discountAmount = 0;

    cart.couponCode = couponCode;
    cart.discount = discountAmount;

    await this.cartRepository.save(cart);
    const totals = this.calculateCartTotals(cart.items, discountAmount);

    this.logger.log(
      `Applied coupon ${couponCode} to cart for user ${userId}`,
    );

    return this.formatResponse(true, 'Coupon applied', {
      ...totals,
      items: cart.items,
    });
  }

  /**
   * Remove coupon code
   */
  async removeCoupon(userId: string) {
    const cart = await this.cartRepository.findByUserId(
      new Types.ObjectId(userId),
    );

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.couponCode = null as any;
    cart.discount = 0;

    await this.cartRepository.save(cart);
    const totals = this.calculateCartTotals(cart.items);

    return this.formatResponse(true, 'Coupon removed', {
      ...totals,
      items: cart.items,
    });
  }

  /**
   * Get abandoned carts (for marketing/recovery emails)
   */
  async getAbandonedCarts(days: number = 7) {
    return this.cartRepository.findAbandonedCarts(days);
  }

  /**
   * Private helper: Validate product availability
   */
  private async isProductAvailable(product: any): Promise<boolean> {
    // Check if product still exists, is active, and has stock
    return (
      product &&
      (product.isActive !== false) &&
      ((product.stock || 0) > 0)
    );
  }

  /**
   * Private helper: Validate all items in cart are still available
   */
  private async validateCartItems(cart: any) {
    for (let i = cart.items.length - 1; i >= 0; i--) {
      try {
        const product = await this.productsService.findOne(
          cart.items[i].productId.toString(),
        );
        const isAvailable = await this.isProductAvailable(product);

        if (!isAvailable) {
          this.logger.warn(
            `Product ${cart.items[i].productId} no longer available, removing from cart`,
          );
          cart.items.splice(i, 1);
        } else {
          // Update stock info
          cart.items[i].stock = (product as any).stock || 0;
          cart.items[i].isAvailable = true;
        }
      } catch (error) {
        this.logger.warn(
          `Error validating product ${cart.items[i].productId}`,
          error.message,
        );
        cart.items.splice(i, 1);
      }
    }

    if (cart.items.length > 0) {
      await this.cartRepository.save(cart);
    }
  }

  /**
   * Calculate cart totals including tax and discount
   */
  calculateCartTotals(
    items: any[],
    couponDiscount: number = 0,
  ): {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    itemCount: number;
  } {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    );
    const itemCount = items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    );

    const totalDiscount = couponDiscount +
      items.reduce((sum, item) => sum + (item.discount || 0), 0);
    
    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    const tax = Math.round(taxableAmount * TAX_RATE * 100) / 100;
    const total = Math.round((taxableAmount + tax) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(totalDiscount * 100) / 100,
      tax,
      total,
      itemCount,
    };
  }

  /**
   * Format standardized response
   */
  formatResponse(success: boolean, message: string, data: any) {
    return { success, message, data };
  }
}
