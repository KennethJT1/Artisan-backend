import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AnalyticsService {
  constructor(@InjectQueue('analytics') private readonly analyticsQueue: Queue) {}

  async trackEvent(userId: string, event: string, metadata: any) {
    await this.analyticsQueue.add('track-event', { userId, event, metadata }, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
    });
  }

  async logEvent(data: { userId: string; event: string; metadata: any }) {
    // Your actual analytics logic goes here
    console.log('📈 Logging event:', data);
    // e.g. save to DB, emit to Mixpanel, etc.
  }
}
