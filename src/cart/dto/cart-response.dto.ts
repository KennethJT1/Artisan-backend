// CartItemDto removed, use inline type
import { CartTotalsDto } from './cart-totals.dto';

export class CartResponseDto {
  _id: string;
  items: Array<{
    productId: string;
    title: string;
    price: number;
    image: string;
    quantity: number;
    currency: string;
  }>;
  totals: CartTotalsDto;
}

export class CartResponseWrapperDto {
  data: CartResponseDto;
}
