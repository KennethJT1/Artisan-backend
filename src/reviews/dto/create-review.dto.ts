import { IsString, IsOptional, IsArray, ArrayMaxSize, IsInt, Min, Max, ValidateIf } from 'class-validator';

export class CreateReviewDto {
  @IsOptional()
  @IsString()
  artisanId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  orderId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5)
  images?: string[];
}
