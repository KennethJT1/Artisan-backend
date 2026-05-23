import { IsNumber, IsString } from 'class-validator';

export class CartTotalsDto {
  @IsNumber()
  subtotal: number;

  @IsNumber()
  discount: number;

  @IsNumber()
  tax: number;

  @IsNumber()
  shipping: number;

  @IsNumber()
  grandTotal: number;

  @IsString()
  currency: string;
}
