import { Field, Float, ObjectType } from '@nestjs/graphql';
import { TransactionIntent } from 'generated/prisma';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';

@ObjectType()
export class IntentBreakdownItem {
  @Field(() => TransactionIntent, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.INTENT })
  intent: TransactionIntent;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.IRT })
  totalIrt: number;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.USD })
  totalUsd: number;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.PERCENTAGE })
  percentage: number;
}

@ObjectType()
export class IntentBreakdownOutput {
  @Field({ description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.PERIOD })
  period: string;

  @Field(() => [IntentBreakdownItem], { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.INTENT_BREAKDOWN_BY_INTENT })
  intents: IntentBreakdownItem[];

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.GRAND_TOTAL_IRT })
  grandTotalIrt: number;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.GRAND_TOTAL_USD })
  grandTotalUsd: number;
}
