import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, Matches } from 'class-validator';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';

@InputType()
export class QueryAnalyticsPeriodInput {
  @Field({ nullable: true, description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.PERIOD })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: ANALYTICS_CONSTANT.ERROR.PERIOD_FORMAT })
  period?: string;
}
