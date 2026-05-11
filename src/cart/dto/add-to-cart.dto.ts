import { IsString, IsNumber, Min, IsOptional, IsObject } from 'class-validator';

export class AddToCartDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsObject()
  variant?: Record<string, any>;
}