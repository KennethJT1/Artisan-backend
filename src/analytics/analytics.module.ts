import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsProcessor } from './analytics.processor';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'analytics',
    }),
  ],
  providers: [AnalyticsProcessor, AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
