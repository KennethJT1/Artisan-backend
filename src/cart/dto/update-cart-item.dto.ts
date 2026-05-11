import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  maxQuantity?: number;
}
