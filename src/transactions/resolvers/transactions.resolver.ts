import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateTransactionInput } from '../dto/create-transaction.input';
import { QueryTransactionInput } from '../dto/query-transaction.input';
import { UpdateTransactionInput } from '../dto/update-transaction.input';
import { Transaction } from '../entities/transaction.entity';
import { TransactionsService } from '../services/transactions.service';

@UseGuards(GqlAuthGuard)
@Resolver(() => Transaction)
export class TransactionsResolver {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Mutation(() => Transaction)
  async createTransaction(
    @Args('createTransactionInput') createTransactionInput: CreateTransactionInput,
    @CurrentUser() user: User,
  ) {
    return await this.transactionsService.create(createTransactionInput, user.id);
  }

  @Query(() => [Transaction], { name: 'transactions' })
  async findAll(
    @CurrentUser() user: User,
    @Args('queryTransactionInput', { type: () => QueryTransactionInput, nullable: true })
    queryTransactionInput?: QueryTransactionInput,
  ) {
    return await this.transactionsService.findAll(user.id, queryTransactionInput);
  }

  @Query(() => Transaction, { name: 'transaction' })
  async findOne(@Args('id') id: string, @CurrentUser() user: User) {
    return await this.transactionsService.findOne(id, user.id);
  }

  @Mutation(() => Transaction)
  async updateTransaction(
    @Args('updateTransactionInput') updateTransactionInput: UpdateTransactionInput,
    @CurrentUser() user: User,
  ) {
    return this.transactionsService.update(updateTransactionInput.id, user.id, updateTransactionInput);
  }

  @Mutation(() => Transaction)
  async removeTransaction(@Args('id') id: string, @CurrentUser() user: User) {
    return await this.transactionsService.remove(id, user.id);
  }
}
