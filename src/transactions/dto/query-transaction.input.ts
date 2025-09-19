import { Field, Float, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsNumber, IsOptional, Length, Max, Min } from 'class-validator';
import { TransactionCategory, TransactionEmotion, TransactionIntent, TransactionType } from 'generated/prisma';
import { QueryOptionInput } from '../../common/dto/query-option.input';
import { TRANSACTION_CONSTANT } from '../constants/transactions.constant';

@InputType()
export class QueryTransactionInput extends QueryOptionInput {
  @IsEnum(TransactionType)
  @IsOptional()
  @Field(() => TransactionType, { nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.TYPE })
  type?: TransactionType;

  @IsEnum(TransactionCategory)
  @IsOptional()
  @Field(() => TransactionCategory, { nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.CATEGORY })
  category?: TransactionCategory;

  @IsEnum(TransactionIntent)
  @IsOptional()
  @Field(() => TransactionIntent, { nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.INTENT })
  intent?: TransactionIntent;

  @IsEnum(TransactionEmotion)
  @IsOptional()
  @Field(() => TransactionEmotion, { nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.EMOTION })
  emotion?: TransactionEmotion;

  @IsDate()
  @IsOptional()
  @Field({ nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.OCCURRED_AT })
  occurredAt?: Date;

  @Max(TRANSACTION_CONSTANT.LENGTH.AMOUNT.MAX)
  @Min(TRANSACTION_CONSTANT.LENGTH.AMOUNT.MIN)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Field(() => Float, { nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.AMOUNT })
  minAmount?: number;

  @Max(TRANSACTION_CONSTANT.LENGTH.AMOUNT.MAX)
  @Min(TRANSACTION_CONSTANT.LENGTH.AMOUNT.MIN)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Field(() => Float, { nullable: true, description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.AMOUNT })
  maxAmount?: number;
}
