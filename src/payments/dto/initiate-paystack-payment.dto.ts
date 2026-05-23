import { IsString, IsNumber } from 'class-validator';

export class InitiatePaystackPaymentDto {
  @IsString() orderId: string;
  @IsNumber() amount: number;
  @IsString() email: string;
}
