import { Field, ObjectType, OmitType, registerEnumType } from '@nestjs/graphql';
import { UserRole } from 'generated/prisma';
import { USER_CONSTANT } from '../constants/users.constant';

@ObjectType()
export class User {
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.ID })
  id: string;

  @Field(() => UserRole, { description: USER_CONSTANT.FIELD_DESCRIPTION.ROLE })
  role: UserRole;

  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.EMAIL })
  email: string;

  // Password should not be included in GraphQL's object type
  password: string;

  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.CREATED_AT })
  createdAt: Date;

  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.UPDATED_AT })
  updatedAt: Date;
}

// A variation of the 'User' object type to be returned after authentication-related processes
@ObjectType()
export class NewUser extends OmitType(User, ['password', 'updatedAt'] as const) {}

// Register 'UserRole' as a GraphQL enum
registerEnumType(UserRole, { name: 'UserRole', description: USER_CONSTANT.FIELD_DESCRIPTION.ROLE });
