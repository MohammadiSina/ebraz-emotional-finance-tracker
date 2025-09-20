import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';

@ObjectType()
export class CurrencyAmount {
  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.USD })
  usd: number;

  @Field(() => Float, { description: ANALYTICS_CONSTANT.FIELD_DESCRIPTION.IRT })
  irt: number;
}
