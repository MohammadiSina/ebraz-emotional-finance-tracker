import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from 'generated/prisma';
import { PrismaService } from '../../common/services/prisma.service';
import { ExchangeRatesService } from '../../exchange-rates/services/exchange-rates.service';
import { TRANSACTION_CONSTANT } from '../constants/transactions.constant';
import { CreateTransactionInput } from '../dto/create-transaction.input';
import { QueryTransactionInput } from '../dto/query-transaction.input';
import { UpdateTransactionInput } from '../dto/update-transaction.input';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  async create(createTransactionInput: CreateTransactionInput, userId: string): Promise<Transaction> {
    // If the exchange rate is not provided, get the latest exchange rate
    const exchangeRate =
      createTransactionInput.exchangeRate ?? (await this.exchangeRatesService.getUsdIrtExchangeRate());

    // Calculate the amount in USD
    const amountInUsd = Number((createTransactionInput.amount / exchangeRate).toFixed(2));

    // Create the transaction
    return this.prisma.transaction.create({ data: { ...createTransactionInput, userId, exchangeRate, amountInUsd } });
  }

  async findAll(userId: string, queryTransactionInput?: QueryTransactionInput): Promise<Transaction[]> {
    const page = queryTransactionInput?.page || 1;
    const take = queryTransactionInput?.take || 3;
    const skip = (page - 1) * take;

    const whereConditions = this.buildQueryFilters(userId, queryTransactionInput);

    return this.prisma.transaction.findMany({
      where: whereConditions,
      skip,
      take,
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({ where: { id, userId } });
    if (!transaction) throw new NotFoundException(TRANSACTION_CONSTANT.ERROR.TRANSACTION_NOT_FOUND(id));

    return transaction;
  }

  async update(
    id: string,
    userId: string,
    updateTransactionInput: UpdateTransactionInput & { amountInUsd?: number },
  ): Promise<Transaction> {
    // Check if the transaction exists
    const user = await this.findOne(id, userId);

    // If user wants to update the amount, the exchange rate and amount in USD must be updated
    if (updateTransactionInput.amount || updateTransactionInput.exchangeRate) {
      updateTransactionInput.exchangeRate ??= await this.exchangeRatesService.getUsdIrtExchangeRate();

      updateTransactionInput.amountInUsd = Number(
        (updateTransactionInput.amount ?? user.amount / updateTransactionInput.exchangeRate).toFixed(2),
      );
    }

    return this.prisma.transaction.update({
      where: { id },
      data: updateTransactionInput,
    });
  }

  async remove(id: string, userId: string): Promise<Transaction> {
    await this.findOne(id, userId);

    return this.prisma.transaction.delete({ where: { id } });
  }

  private buildQueryFilters(userId: string, queryTransactionInput?: QueryTransactionInput): any {
    const whereConditions: any = { userId };

    if (queryTransactionInput?.category) whereConditions.category = queryTransactionInput.category;
    if (queryTransactionInput?.intent) whereConditions.intent = queryTransactionInput.intent;
    if (queryTransactionInput?.emotion) whereConditions.emotion = queryTransactionInput.emotion;

    if (queryTransactionInput?.occurredAt) {
      const startOfDay = new Date(queryTransactionInput.occurredAt);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(queryTransactionInput.occurredAt);
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.occurredAt = { gte: startOfDay, lte: endOfDay };
    }

    if (queryTransactionInput?.minAmount !== undefined || queryTransactionInput?.maxAmount !== undefined) {
      whereConditions.amount = {};

      if (queryTransactionInput.minAmount !== undefined) whereConditions.amount.gte = queryTransactionInput.minAmount;
      if (queryTransactionInput.maxAmount !== undefined) whereConditions.amount.lte = queryTransactionInput.maxAmount;
    }

    return whereConditions;
  }
}
