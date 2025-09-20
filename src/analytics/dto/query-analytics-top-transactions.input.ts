import { Field, InputType } from '@nestjs/graphql';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { QueryAnalyticsPeriodInput } from './query-analytics-period.input';
import { COMMON_CONSTANT } from '../../common/constants/common.constant';

@InputType()
export class QueryAnalyticsTopTransactionsInput extends QueryAnalyticsPeriodInput {
  @Max(COMMON_CONSTANT.LENGTH.TAKE.MAX)
  @Min(COMMON_CONSTANT.LENGTH.TAKE.MIN)
  @IsInt()
  @IsOptional()
  @Field({ nullable: true, description: COMMON_CONSTANT.FIELD_DESCRIPTION.TAKE })
  take?: number;
}
