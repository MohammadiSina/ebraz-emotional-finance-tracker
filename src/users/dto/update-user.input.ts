import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserRole as Role } from 'generated/prisma';
import { USER_CONSTANT, UserRole } from '../constants/users.constant';
import { CreateUserInput } from './create-user.input';

@InputType()
export class UpdateUserInput extends PartialType(OmitType(CreateUserInput, ['password'] as const)) {
  @IsUUID()
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.ID })
  id: string;

  // Using the "defaultValue" for the same field in the CreateUserInput,
  // makes the input object to always include a role field.
  // Therefore, we need to make this field optional in the UpdateUserInput.
  @IsOptional()
  @IsEnum(UserRole)
  @Field({ description: USER_CONSTANT.FIELD_DESCRIPTION.ROLE, nullable: true })
  role?: Role;
}
