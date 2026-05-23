import { IsString, IsNumber, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @IsString()
  productId: string;

  @IsString()
  title: string;

  @IsNumber()
  price: number;

  @IsString()
  image: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  currency: string;
}

export class AddOrUpdateCartItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}
