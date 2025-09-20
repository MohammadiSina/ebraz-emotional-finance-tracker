import { ObjectType, Field, Float } from '@nestjs/graphql';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';
import { CurrencyAmount } from './currency-amount.output';

@ObjectType()
export class SavingsRateOutput {
  @Field({ description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.PERIOD })
  period: string;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.SAVINGS_RATE_PERCENT })
  savingsRatePercent: number;

  @Field(() => CurrencyAmount, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.TOTAL_INCOME })
  totalIncome: CurrencyAmount;

  @Field(() => CurrencyAmount, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.TOTAL_EXPENSE })
  totalExpense: CurrencyAmount;

  @Field(() => CurrencyAmount, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.SAVINGS_AMOUNT })
  savingsAmount: CurrencyAmount;
}
