import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class AddPaymentMethodDto {
  @IsEnum(['card', 'bank', 'paypal'])
  type: 'card' | 'bank' | 'paypal';

  @IsOptional()
  @IsString()
  brand?: string;

  @IsString()
  last4: string;

  @IsOptional()
  @IsNumber()
  expMonth?: number;

  @IsOptional()
  @IsNumber()
  expYear?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  stripePaymentMethodId?: string;
}
