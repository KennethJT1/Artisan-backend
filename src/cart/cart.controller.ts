import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddOrUpdateCartItemsDto } from './dto/cart-item.dto';
import { CartCouponDto } from './dto/cart-coupon.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  async addItems(@Req() req, @Body() dto: AddOrUpdateCartItemsDto) {
    // DTO now expects only productId and quantity
    return this.cartService.addItems(req.user.id, dto);
  }

  @Patch('items')
  async updateItems(@Req() req, @Body() dto: AddOrUpdateCartItemsDto) {
    return this.cartService.updateItems(req.user.id, dto);
  }

  @Delete('items/:productId')
  async removeItem(@Req() req, @Param('productId') productId: string) {
    return this.cartService.removeItem(req.user.id, productId);
  }

  @Delete('clear')
  async clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.id);
  }

  @Post('coupon')
  async applyCoupon(@Req() req, @Body() dto: CartCouponDto) {
    return this.cartService.applyCoupon(req.user.id, dto);
  }

  @Delete('coupon')
  async removeCoupon(@Req() req) {
    return this.cartService.removeCoupon(req.user.id);
  }
}
