import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Transaction, TransactionType } from 'generated/prisma';

import { AnalyticsService } from '../../analytics/services/analytics.service';
import { calculatePeriodRange } from '../../common/helpers/calculate-period-range.helper';
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
    private readonly analyticsService: AnalyticsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(createTransactionInput: CreateTransactionInput, userId: string): Promise<Transaction> {
    // If the exchange rate is not provided, get the latest exchange rate
    const exchangeRate =
      createTransactionInput.exchangeRate ?? (await this.exchangeRatesService.getUsdIrtExchangeRate());

    // Calculate the amount in USD
    const amountInUsd = Number((createTransactionInput.amount / exchangeRate).toFixed(2));

    // Create the transaction
    const transaction = await this.prisma.transaction.create({
      data: { ...createTransactionInput, userId, exchangeRate, amountInUsd },
    });

    // Invalidate analytics cache for this user
    await this.analyticsService.invalidateUserAnalyticsCache(userId);

    return transaction;
  }

  async findAll(userId: string, queryTransactionInput?: QueryTransactionInput): Promise<Transaction[]> {
    const page = queryTransactionInput?.page || 1;
    const take = queryTransactionInput?.take || 3;
    const skip = (page - 1) * take;

    // Generate cache key with filters
    const filtersString = this.generateFiltersString(queryTransactionInput);
    const cacheKey = this.getPaginatedCacheKey(userId, 'findAll', page, take, filtersString);

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<Transaction[]>(cacheKey);
    if (cachedResult) return cachedResult;

    const whereConditions = this.buildQueryFilters(userId, queryTransactionInput);

    const result = await this.prisma.transaction.findMany({
      where: whereConditions,
      skip,
      take,
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    // Cache the result
    await this.cacheManager.set(cacheKey, result, TRANSACTION_CONSTANT.CACHE.TTL.FIND_ALL);

    return result;
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const cacheKey = this.getCacheKey(userId, 'findOne', id);

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<Transaction>(cacheKey);
    if (cachedResult) return cachedResult;

    const transaction = await this.prisma.transaction.findUnique({ where: { id, userId } });
    if (!transaction) throw new NotFoundException(TRANSACTION_CONSTANT.ERROR.TRANSACTION_NOT_FOUND(id));

    // Cache the result
    await this.cacheManager.set(cacheKey, transaction, TRANSACTION_CONSTANT.CACHE.TTL.FIND_ONE);

    return transaction;
  }

  async findTopExpenseTransactions(userId: string, period?: string): Promise<Partial<Transaction>[]> {
    const { start, end, periodString } = calculatePeriodRange(period);
    const cacheKey = this.getCacheKey(userId, 'findTopExpense', periodString);

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<Partial<Transaction>[]>(cacheKey);
    if (cachedResult) return cachedResult;

    const result = await this.prisma.transaction.findMany({
      where: { userId, type: TransactionType.EXPENSE, occurredAt: { gte: start, lt: end } },
      orderBy: [{ amount: 'desc' }, { occurredAt: 'asc' }],
      take: TRANSACTION_CONSTANT.LENGTH.INSIGHT_TRANSACTIONS.MAX,
      select: {
        category: true,
        amount: true,
        amountInUsd: true,
        intent: true,
        emotion: true,
        note: true,
        occurredAt: true,
      },
    });

    // Cache the result
    await this.cacheManager.set(cacheKey, result, TRANSACTION_CONSTANT.CACHE.TTL.TOP_EXPENSE);

    return result;
  }

  // Used by users service to find those with minimum required 'EXPENSE' transactions for insights generation
  async findUsersWithMinimumTransactions(minInsightTransactions: number, period?: string) {
    const { start, end } = calculatePeriodRange(period);

    return this.prisma.transaction.groupBy({
      by: ['userId'],
      where: { occurredAt: { gte: start, lt: end }, type: TransactionType.EXPENSE },
      _count: { userId: true },
      having: { userId: { _count: { gte: minInsightTransactions } } },
      orderBy: { _count: { userId: 'desc' } },
    });
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
        ((updateTransactionInput.amount ?? user.amount) / updateTransactionInput.exchangeRate).toFixed(2),
      );
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id },
      data: updateTransactionInput,
    });

    // Invalidate analytics cache for this user
    await this.analyticsService.invalidateUserAnalyticsCache(userId);

    return updatedTransaction;
  }

  async remove(id: string, userId: string): Promise<Transaction> {
    await this.findOne(id, userId);

    const deletedTransaction = await this.prisma.transaction.delete({ where: { id } });

    // Invalidate analytics cache for this user
    await this.analyticsService.invalidateUserAnalyticsCache(userId);

    return deletedTransaction;
  }

  // ==================== HELPER METHODS ====================

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

    if (queryTransactionInput?.minAmountInUsd !== undefined || queryTransactionInput?.maxAmountInUsd !== undefined) {
      whereConditions.amountInUsd = {};

      if (queryTransactionInput.minAmountInUsd !== undefined)
        whereConditions.amountInUsd.gte = queryTransactionInput.minAmountInUsd;

      if (queryTransactionInput.maxAmountInUsd !== undefined)
        whereConditions.amountInUsd.lte = queryTransactionInput.maxAmountInUsd;
    }

    return whereConditions;
  }

  /**
   * Generates a cache key for transaction data
   */
  private getCacheKey(userId: string, method: string, additionalParams?: string): string {
    const paramsKey = additionalParams ? `:${additionalParams}` : '';
    return `${TRANSACTION_CONSTANT.CACHE.KEY_PREFIX}${method}:${userId}${paramsKey}`;
  }

  /**
   * Generates a cache key for paginated queries
   */
  private getPaginatedCacheKey(userId: string, method: string, page: number, take: number, filters?: string): string {
    const filtersKey = filters ? `:${filters}` : '';
    return `${TRANSACTION_CONSTANT.CACHE.KEY_PREFIX}${method}:${userId}:${page}:${take}${filtersKey}`;
  }

  /**
   * Generates a string representation of query filters for cache key
   */
  private generateFiltersString(queryTransactionInput?: QueryTransactionInput): string {
    if (!queryTransactionInput) return '';

    const filters: string[] = [];
    if (queryTransactionInput.category) filters.push(`cat:${queryTransactionInput.category}`);
    if (queryTransactionInput.intent) filters.push(`int:${queryTransactionInput.intent}`);
    if (queryTransactionInput.emotion) filters.push(`emo:${queryTransactionInput.emotion}`);
    if (queryTransactionInput.occurredAt)
      filters.push(`date:${queryTransactionInput.occurredAt.toISOString().split('T')[0]}`);
    if (queryTransactionInput.minAmount !== undefined) filters.push(`minAmt:${queryTransactionInput.minAmount}`);
    if (queryTransactionInput.maxAmount !== undefined) filters.push(`maxAmt:${queryTransactionInput.maxAmount}`);
    if (queryTransactionInput.minAmountInUsd !== undefined)
      filters.push(`minUsd:${queryTransactionInput.minAmountInUsd}`);
    if (queryTransactionInput.maxAmountInUsd !== undefined)
      filters.push(`maxUsd:${queryTransactionInput.maxAmountInUsd}`);

    return filters.join('|');
  }
}
