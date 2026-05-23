import { IsString } from 'class-validator';

export class CartCouponDto {
  @IsString()
  couponCode: string;
}
