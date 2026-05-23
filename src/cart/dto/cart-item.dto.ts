import { IsString, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddOrUpdateCartItemInputDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class AddOrUpdateCartItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddOrUpdateCartItemInputDto)
  items: AddOrUpdateCartItemInputDto[];
}
