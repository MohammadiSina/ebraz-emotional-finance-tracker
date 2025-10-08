import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { INSIGHTS_CONSTANT } from '../constants/insights.constant';
import { InsightsService } from '../services/insights.service';

@Processor(INSIGHTS_CONSTANT.QUEUE_NAME, { limiter: INSIGHTS_CONSTANT.QUEUE_LIMITER })
export class InsightsConsumer extends WorkerHost {
  constructor(private readonly insightsService: InsightsService) {
    super();
  }

  async process(job: Job<{ userId: string }>): Promise<any> {
    if (job.name !== 'generate' || !job.data.userId) return;

    await this.insightsService.generate(job.data.userId);
  }
}
