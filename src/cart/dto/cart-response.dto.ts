import { CartItemDto } from './cart-item.dto';
import { CartTotalsDto } from './cart-totals.dto';

export class CartResponseDto {
  _id: string;
  items: CartItemDto[];
  totals: CartTotalsDto;
}

export class CartResponseWrapperDto {
  data: CartResponseDto;
}
