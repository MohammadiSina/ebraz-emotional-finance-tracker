import { Field, Float, ObjectType, registerEnumType } from '@nestjs/graphql';
import { TransactionCategory, TransactionEmotion, TransactionIntent } from 'generated/prisma';
import { TRANSACTION_CONSTANT } from '../constants/transactions.constant';

@ObjectType()
export class Transaction {
  @Field({ description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.ID })
  id: string;

  @Field({ description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.USER_ID })
  userId: string;

  @Field(() => Float, { description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.AMOUNT })
  amount: number;

  @Field({ description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.CURRENCY })
  currency: string;

  @Field(() => TransactionCategory, { description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.CATEGORY })
  category: TransactionCategory;

  @Field(() => TransactionIntent, { description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.INTENT })
  intent: TransactionIntent;

  @Field(() => TransactionEmotion, { description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.EMOTION })
  emotion: TransactionEmotion;

  @Field({ nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.NOTE })
  note?: string;

  @Field({ description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.OCCURRED_AT })
  occurredAt: Date;

  @Field({ description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.CREATED_AT })
  createdAt: Date;

  @Field({ description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.UPDATED_AT })
  updatedAt: Date;
}

// Register Prisma enums as GraphQL enums
registerEnumType(TransactionCategory, {
  name: 'TransactionCategory',
  description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.CATEGORY,
});

registerEnumType(TransactionIntent, {
  name: 'TransactionIntent',
  description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.INTENT,
});

registerEnumType(TransactionEmotion, {
  name: 'TransactionEmotion',
  description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.EMOTION,
});
