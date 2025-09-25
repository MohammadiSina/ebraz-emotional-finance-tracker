import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueryOptionInput } from '../../common/dto/query-option.input';
import { User } from '../../users/entities/user.entity';
import { QueryInsightPeriodInput } from '../dto/query-insight-period.input';
import { Insight } from '../entities/insight.entity';
import { InsightsService } from '../services/insights.service';

@UseGuards(GqlAuthGuard)
@Resolver(() => Insight)
export class InsightsResolver {
  constructor(private readonly insightsService: InsightsService) {}

  @Query(() => [Insight], { name: 'insights' })
  async findAll(
    @CurrentUser() user: User,
    @Args('queryInsightInput', { type: () => QueryOptionInput, nullable: true }) queryInsightInput?: QueryOptionInput,
  ) {
    return await this.insightsService.findAll(user.id, queryInsightInput);
  }

  @Query(() => Insight, { name: 'insight' })
  async findOne(@CurrentUser() user: User, @Args('id') id: string) {
    return await this.insightsService.findOne(id, user.id);
  }

  @Query(() => Insight, { name: 'insightByPeriod' })
  async findByPeriod(
    @CurrentUser() user: User,
    @Args('queryInsightPeriodInput', { type: () => QueryInsightPeriodInput })
    queryInsightPeriodInput: QueryInsightPeriodInput,
  ) {
    return await this.insightsService.findByPeriod(queryInsightPeriodInput, user.id);
  }
}
