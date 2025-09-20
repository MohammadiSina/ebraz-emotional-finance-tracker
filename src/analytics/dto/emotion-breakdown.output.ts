import { Field, ObjectType, Float } from '@nestjs/graphql';
import { TransactionEmotion } from 'generated/prisma';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';

@ObjectType()
export class EmotionBreakdownItem {
  @Field(() => TransactionEmotion, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.EMOTION })
  emotion: TransactionEmotion;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.IRT })
  totalIrt: number;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.USD })
  totalUsd: number;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.PERCENTAGE })
  percentage: number;
}

@ObjectType()
export class EmotionBreakdownOutput {
  @Field({ description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.PERIOD })
  period: string;

  @Field(() => [EmotionBreakdownItem], {
    description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.EMOTION_BREAKDOWN_BY_EMOTION,
  })
  emotions: EmotionBreakdownItem[];

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.GRAND_TOTAL_IRT })
  grandTotalIrt: number;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.GRAND_TOTAL_USD })
  grandTotalUsd: number;
}
