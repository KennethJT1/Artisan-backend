import { IsString, IsArray, ValidateNested, IsObject, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ContactInfoDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsString() email: string;
  @IsString() phone: string;
}

export class ShippingAddressDto {
  @IsString() street: string;
  @IsString() city: string;
  @IsString() state: string;
  @IsString() postalCode: string;
  @IsString() country: string;
}

export class OrderCartItemDto {
  @IsString() productId: string;
  @IsString() title: string;
  @IsNumber() price: number;
  @IsNumber() quantity: number;
  @IsString() image: string;
  @IsString() currency: string;
}

export class OrderTotalsDto {
  @IsNumber() subtotal: number;
  @IsNumber() discount: number;
  @IsNumber() tax: number;
  @IsNumber() shipping: number;
  @IsNumber() grandTotal: number;
  @IsString() currency: string;
}

export enum PaymentMethod {
  PAYSTACK = 'paystack',
}

export class CreateOrderDto {
  @ValidateNested() @Type(() => ContactInfoDto) contactInfo: ContactInfoDto;
  @ValidateNested() @Type(() => ShippingAddressDto) shippingAddress: ShippingAddressDto;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderCartItemDto) items: OrderCartItemDto[];
  @ValidateNested() @Type(() => OrderTotalsDto) totals: OrderTotalsDto;
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
}
