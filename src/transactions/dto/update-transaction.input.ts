import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { TRANSACTION_CONSTANT } from '../constants/transactions.constant';
import { CreateTransactionInput } from './create-transaction.input';

@InputType()
export class UpdateTransactionInput extends PartialType(CreateTransactionInput) {
  @IsUUID()
  @Field({ description: TRANSACTION_CONSTANT.FIELD_DESCRIPTION.ID })
  id: string;
}
