import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { USER_CONSTANT } from '../constants/users.constant';
import { CreateUserInput } from './create-user.input';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @IsUUID()
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.ID })
  id: string;
}
