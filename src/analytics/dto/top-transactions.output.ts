import { Field, ObjectType, Float } from '@nestjs/graphql';
import { TransactionCategory, TransactionType } from 'generated/prisma';

@ObjectType()
export class TopTransactionItem {
  @Field(() => Float)
  amount: number;

  @Field(() => Float)
  amountInUsd: number;

  @Field(() => TransactionCategory)
  category: TransactionCategory;

  @Field(() => TransactionType)
  type: TransactionType;

  @Field({ nullable: true })
  note?: string;

  @Field()
  occurredAt: Date;
}

@ObjectType()
export class TopTransactionsOutput {
  @Field()
  period: string;

  @Field(() => [TopTransactionItem])
  transactions: TopTransactionItem[];
}
