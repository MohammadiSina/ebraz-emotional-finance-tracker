import { Field, InputType } from '@nestjs/graphql';
import { IsStrongPassword, IsUUID } from 'class-validator';
import { USER_CONSTANT } from '../constants/users.constant';

@InputType()
export class UpdateUserCredentialInput {
  @IsUUID()
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.ID })
  id: string;

  @IsStrongPassword({ minLength: USER_CONSTANT.LENGTH.PASSWORD.MIN }, { message: USER_CONSTANT.ERROR.INVALID_PASSWORD })
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.PASSWORD })
  password: string;
}
