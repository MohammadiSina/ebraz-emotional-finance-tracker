import { InputType, OmitType } from '@nestjs/graphql';
import { CreateUserInput } from '../../users/dto/create-user.input';

@InputType()
export class RegisterInput extends OmitType(CreateUserInput, ['role'] as const) {}
