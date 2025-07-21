import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { QueryOptionInput } from '../../common/dto/query-option.input';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  async createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return await this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  async findAll(
    @Args('queryUserInput', { type: () => QueryOptionInput, nullable: true }) queryUserInput?: QueryOptionInput,
  ) {
    return await this.usersService.findAll(queryUserInput);
  }

  @Query(() => User, { name: 'user' })
  async findOne(@Args('id') id: string) {
    return await this.usersService.findOne(id);
  }

  @Mutation(() => User)
  async updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return await this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  async removeUser(@Args('id') id: string) {
    return await this.usersService.remove(id);
  }
}
