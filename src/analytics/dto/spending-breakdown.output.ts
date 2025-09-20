import { ObjectType, Field, Float } from '@nestjs/graphql';
import { TransactionCategory } from 'generated/prisma';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';

@ObjectType()
export class CategorySpending {
  @Field(() => TransactionCategory, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.CATEGORY })
  category: TransactionCategory;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.IRT })
  totalIrt: number;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.USD })
  totalUsd: number;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.PERCENTAGE })
  percentage: number;
}

@ObjectType()
export class SpendingBreakdownOutput {
  @Field({ description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.PERIOD })
  period: string;

  @Field(() => [CategorySpending], { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.SPENDING_BREAKDOWN_BY_CATEGORY })
  categories: CategorySpending[];

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.GRAND_TOTAL_IRT })
  grandTotalIrt: number;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.GRAND_TOTAL_USD })
  grandTotalUsd: number;
}
