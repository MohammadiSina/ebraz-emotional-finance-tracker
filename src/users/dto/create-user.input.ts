import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsStrongPassword, Length } from 'class-validator';
import { UserRole } from 'generated/prisma';
import { USER_CONSTANT } from '../constants/users.constant';

@InputType()
export class CreateUserInput {
  @IsEmail()
  @Length(USER_CONSTANT.LENGTH.EMAIL.MIN, USER_CONSTANT.LENGTH.EMAIL.MAX)
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.EMAIL })
  email: string;

  @IsEnum(UserRole)
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.ROLE, defaultValue: UserRole.USER })
  role: UserRole;

  @IsStrongPassword({ minLength: USER_CONSTANT.LENGTH.PASSWORD.MIN }, { message: USER_CONSTANT.ERROR.INVALID_PASSWORD })
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.PASSWORD })
  password: string;
}
