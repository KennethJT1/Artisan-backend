import { Type } from 'class-transformer';
import { ValidateNested, ArrayNotEmpty, IsArray } from 'class-validator';
import { AddToCartDto } from './add-to-cart.dto';

export class AddMultipleToCartDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AddToCartDto)
  items: AddToCartDto[];
}
