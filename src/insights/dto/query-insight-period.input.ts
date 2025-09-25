import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';

import { INSIGHTS_CONSTANT } from '../constants/insights.constant';

@InputType()
export class QueryInsightPeriodInput {
  @Matches(/^\d{4}-\d{2}$/, { message: INSIGHTS_CONSTANT.ERROR.PERIOD_FORMAT })
  @Field({ description: INSIGHTS_CONSTANT.FIELD_DESCRIPTION.PERIOD })
  period: string;
}
