import { ObjectType, Field } from '@nestjs/graphql';
import { USER_CONSTANT } from '../constants/users.constant';

@ObjectType()
export class User {
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.ID })
  id: string;

  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.EMAIL })
  email: string;

  // Password should not be included in GraphQL's object type
  password: string;

  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.CREATED_AT })
  createdAt: Date;

  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.UPDATED_AT })
  updatedAt: Date;
}
