import {
  Controller,
  Post,
  Body,
  Delete,
  Get,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@User() user: { id: string }) {
    return await this.cartService.getCart(user.id);
  }

  @Post('items')
  async addToCart(
    @User() user: { id: string },
    @Body()
    addMultipleToCartDto: import('./dto/add-multiple-to-cart.dto').AddMultipleToCartDto,
  ) {
    return await this.cartService.addMultipleToCart(
      user.id,
      addMultipleToCartDto.items,
    );
  }

  @Patch('items')
  async updateQuantity(
    @User() user: { id: string },
    @Body() body: { items: UpdateCartItemDto[] },
  ) {
    return await this.cartService.updateMultiple(user.id, body.items);
  }

  @Delete('items/:productId')
  async removeItem(
    @User() user: { id: string },
    @Param('productId') productId: string,
  ) {
    return await this.cartService.removeFromCart(user.id, productId);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  async clearCart(@User() user: { id: string }) {
    return await this.cartService.clearCart(user.id);
  }

  @Post('coupon')
  async applyCoupon(
    @User() user: { id: string },
    @Body() body: { couponCode: string },
  ) {
    return await this.cartService.applyCoupon(user.id, body.couponCode);
  }

  @Delete('coupon')
  async removeCoupon(@User() user: { id: string }) {
    return await this.cartService.removeCoupon(user.id);
  }
}
