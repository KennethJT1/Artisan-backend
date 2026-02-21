import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from 'src/bookings/schemas/bookings.schema';
import {
  Favourite,
  FavouriteSchema,
} from 'src/favourites/schemas/favourite.schema';
import { Review, ReviewSchema } from 'src/reviews/schemas/review.schema';
import { Payment, PaymentSchema } from 'src/payments/schemas/payment.schema';
import { PaymentsService } from 'src/payments/payments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Favourite.name, schema: FavouriteSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService,PaymentsService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
