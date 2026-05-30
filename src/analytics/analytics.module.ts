import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsProcessor } from './analytics.processor';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Category, CategorySchema } from '../category/schemas/category.schema';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'analytics',
    }),
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsProcessor, AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
