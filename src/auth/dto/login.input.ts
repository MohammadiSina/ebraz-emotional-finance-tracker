import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, Length } from 'class-validator';
import { USER_CONSTANT } from '../../users/constants/users.constant';

@InputType()
export class LoginInput {
  @IsEmail()
  @Length(USER_CONSTANT.LENGTH.EMAIL.MIN, USER_CONSTANT.LENGTH.EMAIL.MAX)
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.EMAIL })
  email: string;

  @Length(USER_CONSTANT.LENGTH.PASSWORD.MIN, USER_CONSTANT.LENGTH.PASSWORD.MAX)
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.PASSWORD })
  password: string;
}
