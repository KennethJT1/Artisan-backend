import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalyticsService } from './analytics.service';

@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
  constructor(private readonly analyticsService: AnalyticsService) {
    super();
  }

  async process(job: Job<{ userId: string; event: string; metadata: any }>) {
    try {
      console.log(`📊 Processing analytics job for user ${job.data.userId}`);
      await this.analyticsService.logEvent(job.data);
      console.log(`✅ Event "${job.data.event}" processed successfully`);
    } catch (error) {
      console.error(`❌ Failed to process analytics event:`, error);
      throw error;
    }
  }
}
