import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';
import { EmotionBreakdownOutput } from '../dto/emotion-breakdown.output';
import { IntentBreakdownOutput } from '../dto/intent-breakdown.output';
import { NetBalanceOutput } from '../dto/net-balance.output';
import { QueryAnalyticsPeriodInput } from '../dto/query-analytics-period.input';
import { QueryAnalyticsTopTransactionsInput } from '../dto/query-analytics-top-transactions.input';
import { SavingsRateOutput } from '../dto/savings-rate.output';
import { SpendingBreakdownOutput } from '../dto/spending-breakdown.output';
import { TopTransactionsOutput } from '../dto/top-transactions.output';
import { AnalyticsService } from '../services/analytics.service';

@UseGuards(GqlAuthGuard)
@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => NetBalanceOutput, { description: ANALYTICS_CONSTANT.RESOLVER_DESCRIPTION.GET_NET_BALANCE })
  async getNetBalance(
    @CurrentUser() user: User,
    @Args('input', { type: () => QueryAnalyticsPeriodInput, nullable: true }) input?: QueryAnalyticsPeriodInput,
  ): Promise<NetBalanceOutput> {
    return await this.analyticsService.getNetBalance(user.id, input?.period);
  }

  @Query(() => SpendingBreakdownOutput, { description: ANALYTICS_CONSTANT.RESOLVER_DESCRIPTION.GET_SPENDING_BREAKDOWN })
  async getSpendingBreakdown(
    @Args('input', { type: () => QueryAnalyticsPeriodInput, nullable: true }) input: QueryAnalyticsPeriodInput,
    @CurrentUser() user: User,
  ): Promise<SpendingBreakdownOutput> {
    return await this.analyticsService.getSpendingBreakdown(user.id, input?.period);
  }

  @Query(() => IntentBreakdownOutput, { description: ANALYTICS_CONSTANT.RESOLVER_DESCRIPTION.GET_INTENT_BREAKDOWN })
  async getIntentBreakdown(
    @Args('input', { type: () => QueryAnalyticsPeriodInput, nullable: true }) input: QueryAnalyticsPeriodInput,
    @CurrentUser() user: User,
  ): Promise<IntentBreakdownOutput> {
    return await this.analyticsService.getIntentBreakdown(user.id, input?.period);
  }

  @Query(() => EmotionBreakdownOutput, { description: ANALYTICS_CONSTANT.RESOLVER_DESCRIPTION.GET_EMOTION_BREAKDOWN })
  async getEmotionBreakdown(
    @Args('input', { type: () => QueryAnalyticsPeriodInput, nullable: true }) input: QueryAnalyticsPeriodInput,
    @CurrentUser() user: User,
  ): Promise<EmotionBreakdownOutput> {
    return await this.analyticsService.getEmotionBreakdown(user.id, input?.period);
  }

  @Query(() => SavingsRateOutput, { description: ANALYTICS_CONSTANT.RESOLVER_DESCRIPTION.GET_SAVINGS_RATE })
  async getSavingsRate(
    @Args('input', { type: () => QueryAnalyticsPeriodInput, nullable: true }) input: QueryAnalyticsPeriodInput,
    @CurrentUser() user: User,
  ): Promise<SavingsRateOutput> {
    return await this.analyticsService.getSavingsRate(user.id, input?.period);
  }

  @Query(() => TopTransactionsOutput, { description: ANALYTICS_CONSTANT.RESOLVER_DESCRIPTION.GET_TOP_TRANSACTIONS })
  async getTopTransactions(
    @Args('input', { type: () => QueryAnalyticsTopTransactionsInput, nullable: true })
    input: QueryAnalyticsTopTransactionsInput,
    @CurrentUser() user: User,
  ): Promise<TopTransactionsOutput> {
    return await this.analyticsService.getTopTransactions(user.id, input?.period, input?.take);
  }
}
