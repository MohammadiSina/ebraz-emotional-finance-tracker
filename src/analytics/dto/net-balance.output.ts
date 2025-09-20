import { Field, ObjectType } from '@nestjs/graphql';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';
import { CurrencyAmount } from './currency-amount.output';

@ObjectType()
export class NetBalanceOutput {
  @Field({ description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.PERIOD })
  period: string;

  @Field(() => CurrencyAmount, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.NET_BALANCE })
  netBalance: CurrencyAmount;

  @Field(() => CurrencyAmount, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.TOTAL_INCOME })
  totalIncome: CurrencyAmount;

  @Field(() => CurrencyAmount, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.TOTAL_EXPENSE })
  totalExpense: CurrencyAmount;
}
