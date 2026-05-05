import {
  Controller,
  Post,
  Body,
  Delete,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
// import { AddMultipleToCartDto } from './dto/add-multiple-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator'; // Ensure this path is correct and file exists

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
    @Body() addMultipleToCartDto: import('./dto/add-multiple-to-cart.dto').AddMultipleToCartDto,
  ) {
    // ValidationPipe will enforce DTO constraints
    return await this.cartService.addMultipleToCart(user.id, addMultipleToCartDto.items);
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
  async clearCart(@User() user: { id: string }) {
    return await this.cartService.clearCart(user.id);
  }

  // Checkout endpoint will be refactored in next step
}
