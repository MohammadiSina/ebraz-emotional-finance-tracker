import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { AnalyticsModule } from '../analytics/analytics.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { INSIGHTS_CONSTANT } from './constants/insights.constant';
import { InsightsConsumer } from './consumers/insights.consumer';
import { InsightsResolver } from './resolvers/insights.resolver';
import { InsightsSchedulerService } from './services/insights-scheduler.service';
import { InsightsService } from './services/insights.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: INSIGHTS_CONSTANT.QUEUE_NAME }),
    BullBoardModule.forFeature({ name: INSIGHTS_CONSTANT.QUEUE_NAME, adapter: BullMQAdapter }),
    UsersModule,
    TransactionsModule,
    AnalyticsModule,
  ],
  providers: [InsightsResolver, InsightsService, InsightsSchedulerService, InsightsConsumer],
})
export class InsightsModule {}
