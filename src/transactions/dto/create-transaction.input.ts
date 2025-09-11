import { Field, Float, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, Length, Max, Min } from 'class-validator';
import { TransactionCategory, TransactionEmotion, TransactionIntent, TransactionType } from 'generated/prisma';
import { TRANSACTION_CONSTANT } from '../constants/transactions.constant';

@InputType()
export class CreateTransactionInput {
  // userId is fetched from the JWT token, not provided by the client.
  // That's for preventing users from creating transactions for other users.

  // Note:
  //  Default values are handled at the database level (via Prisma schema)
  //  or explicitly in the service layer when needed.
  //  We avoid using { defaultValue: ... } in @Field() because that would
  //  force GraphQL to inject defaults into DTOs (e.g., during updates),
  //  which can lead to unintended overwrites. Prisma is the source of truth
  //  for defaults, so DTOs only declare optionality, not defaults.

  @IsOptional()
  @IsEnum(TransactionType)
  @Field(() => TransactionType, { nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.TYPE })
  type?: TransactionType;

  @Max(TRANSACTION_CONSTANT.LENGTH.AMOUNT.MAX)
  @Min(TRANSACTION_CONSTANT.LENGTH.AMOUNT.MIN)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Field(() => Float, { description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.AMOUNT })
  amount: number;

  @Length(TRANSACTION_CONSTANT.LENGTH.CURRENCY.MIN, TRANSACTION_CONSTANT.LENGTH.CURRENCY.MAX)
  @IsOptional() // Default to 'IRR' if not provided
  @Field({ nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.CURRENCY })
  currency?: string;

  @IsEnum(TransactionCategory)
  @IsOptional() // Default to 'OTHER' if not provided
  @Field(() => TransactionCategory, { description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.CATEGORY })
  category?: TransactionCategory;

  @IsEnum(TransactionIntent)
  @Field(() => TransactionIntent, { description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.INTENT })
  intent: TransactionIntent;

  @IsEnum(TransactionEmotion)
  @Field(() => TransactionEmotion, { description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.EMOTION })
  emotion: TransactionEmotion;

  @Length(TRANSACTION_CONSTANT.LENGTH.NOTE.MIN, TRANSACTION_CONSTANT.LENGTH.NOTE.MAX)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @Field({ nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.NOTE })
  note?: string;

  @IsDate()
  @IsOptional() // Default to current date if not provided
  @Field({ nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.OCCURRED_AT })
  occurredAt?: Date;
}
