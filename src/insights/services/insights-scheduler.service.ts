import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InsightsService } from './insights.service';

@Injectable()
export class InsightsSchedulerService {
  constructor(private readonly insightsService: InsightsService) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleInsightGenerationCron() {
    // TODO: Add logging
    await this.insightsService.generateMany();
  }
}
