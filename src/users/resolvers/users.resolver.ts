import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueryOptionInput } from '../../common/dto/query-option.input';
import { UserRole } from '../constants/users.constant';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { NewUser, User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';
import { UpdateUserCredentialInput } from '../dto/update-user-credential.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => NewUser)
  async createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return await this.usersService.create(createUserInput);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [User], { name: 'users' })
  async findAll(
    @Args('queryUserInput', { type: () => QueryOptionInput, nullable: true }) queryUserInput?: QueryOptionInput,
  ) {
    return await this.usersService.findAll(queryUserInput);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => User, { name: 'user' })
  async findOne(@Args('id') id: string) {
    return await this.usersService.findOne(id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => User)
  async updateUser(@CurrentUser() user: User, @Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return await this.usersService.update(updateUserInput.id, updateUserInput, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => User)
  async updateUserCredential(
    @CurrentUser() user: User,
    @Args('updateUserCredentialInput') updateUserCredentialInput: UpdateUserCredentialInput,
  ) {
    return await this.usersService.updateCredential(updateUserCredentialInput.id, updateUserCredentialInput, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => User)
  async removeUser(@CurrentUser() user: User, @Args('id') id: string) {
    return await this.usersService.remove(id, user);
  }
}
