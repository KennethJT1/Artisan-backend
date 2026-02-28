import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsMongoId,
  Min,
  Max,
  Length,
} from 'class-validator';
import { BookingStatus } from '../schemas/bookings.schema';

export class CreateBookingDto {
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @IsMongoId()
  artisanId: string;

  @IsString()
  service: string;

  @IsDateString()
  date: Date;

  @IsString()
  time: string;

  @IsNumber()
  duration: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsNumber()
  commission?: number;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  review?: string;

  @IsString()
  location: string;
}
