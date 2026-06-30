import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LinksModule } from './links/links.module';
import { DomainsModule } from './domains/domains.module';
import { BillingModule } from './billing/billing.module';
import { CommonModule } from './common/common.module';
import { BookingsModule } from './bookings/bookings.module';
import { ProductsModule } from './products/products.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { ArtisansModule } from './artisans/artisans.module';
import { CategoriesModule } from './category/category.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AdminModule } from './admin/admin.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavouritesModule } from './favourites/favourites.module';

import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    JwtModule.register({
      // secret: process.env.JWT_SECRET,
      // signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
     secret: process.env.JWT_SECRET!,
     signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as any,
      } ,
}),
    // BullModule.forRoot({
    //   connection: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: Number(process.env.REDIS_PORT) || 6379,
    //   },
    // }),

    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL, tls: {} },
    }),
    UsersModule,
    AuthModule,
    LinksModule,
    DomainsModule,
    AnalyticsModule,
    BillingModule,
    CommonModule,
    BookingsModule,
    ProductsModule,
    PaymentsModule,
    ArtisansModule,
    CategoriesModule,
    CloudinaryModule,
    AdminModule,
    FavouritesModule,
    ReviewsModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
