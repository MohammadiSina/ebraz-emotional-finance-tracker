import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsStrongPassword, Length } from 'class-validator';
import { USER_CONSTANT } from '../constants/users.constant';

@InputType()
export class CreateUserInput {
  @IsEmail()
  @Length(USER_CONSTANT.LENGTH.EMAIL.MIN, USER_CONSTANT.LENGTH.EMAIL.MAX)
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.EMAIL })
  email: string;

  @IsStrongPassword({ minLength: USER_CONSTANT.LENGTH.PASSWORD.MIN }, { message: USER_CONSTANT.ERROR.INVALID_PASSWORD })
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.PASSWORD })
  password: string;
}
