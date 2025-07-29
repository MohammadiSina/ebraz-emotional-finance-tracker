import { Field, ObjectType } from '@nestjs/graphql';
import { NewUser } from '../../users/entities/user.entity';
import { AUTH_CONSTANT } from '../constants/auth.constant';

@ObjectType()
export class AuthPayload {
  @Field({ description: AUTH_CONSTANT.FIELD_DESCRIPTION.ACCESS_TOKEN })
  accessToken: string;

  @Field(() => NewUser, { description: AUTH_CONSTANT.FIELD_DESCRIPTION.USER })
  user: NewUser;
}
