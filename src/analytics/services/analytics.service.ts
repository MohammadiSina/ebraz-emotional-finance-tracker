import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TransactionCategory, TransactionEmotion, TransactionIntent, TransactionType } from 'generated/prisma';

import { calculatePeriodRange } from '../../common/helpers/calculate-period-range.helper';
import { PrismaService } from '../../common/services/prisma.service';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';
import { EmotionBreakdownOutput } from '../dto/emotion-breakdown.output';
import { IntentBreakdownOutput } from '../dto/intent-breakdown.output';
import { NetBalanceOutput } from '../dto/net-balance.output';
import { SavingsRateOutput } from '../dto/savings-rate.output';
import { SpendingBreakdownOutput } from '../dto/spending-breakdown.output';
import { TopTransactionItem, TopTransactionsOutput } from '../dto/top-transactions.output';
import { TransactionAmounts, TransactionTotals } from '../types/transaction-calculation.interface';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Calculates the net balance (income - expenses) for a user in a given period
   */
  async getNetBalance(userId: string, period?: string): Promise<NetBalanceOutput> {
    const { start, end, periodString } = calculatePeriodRange(period);
    const cacheKey = this.getCacheKey(userId, 'netBalance', periodString);

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<NetBalanceOutput>(cacheKey);
    if (cachedResult) return cachedResult;

    const transactions = await this.fetchTransactionsByPeriod(userId, start, end, {
      type: true,
      amount: true,
      amountInUsd: true,
    });

    const { totalIncome, totalExpense } = this.calculateIncomeAndExpenseTotals(transactions);

    const result: NetBalanceOutput = {
      period: periodString,
      netBalance: this.calculateNetBalance(totalIncome, totalExpense),
      totalIncome,
      totalExpense,
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, result, ANALYTICS_CONSTANT.CACHE.TTL.NET_BALANCE);

    return result;
  }

  /**
   * Analyzes spending patterns by category for a user in a given period
   */
  async getSpendingBreakdown(userId: string, period?: string): Promise<SpendingBreakdownOutput> {
    const { start, end, periodString } = calculatePeriodRange(period);
    const cacheKey = this.getCacheKey(userId, 'spendingBreakdown', periodString);

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<SpendingBreakdownOutput>(cacheKey);
    if (cachedResult) return cachedResult;

    const transactions = await this.fetchTransactionsByPeriod(
      userId,
      start,
      end,
      { category: true, amount: true, amountInUsd: true },
      { type: TransactionType.EXPENSE },
    );

    const { totals: categoryTotals, grandTotal } = this.calculateTransactionTotals(transactions, 'category');

    const result: SpendingBreakdownOutput = {
      period: periodString,
      categories: this.mapCategoryTotalsToBreakdownItems(categoryTotals, grandTotal),
      grandTotalIrt: grandTotal.irt,
      grandTotalUsd: grandTotal.usd,
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, result, ANALYTICS_CONSTANT.CACHE.TTL.SPENDING_BREAKDOWN);

    return result;
  }

  /**
   * Analyzes transaction patterns by intent for a user in a given period
   */
  async getIntentBreakdown(userId: string, period?: string): Promise<IntentBreakdownOutput> {
    const { start, end, periodString } = calculatePeriodRange(period);
    const cacheKey = this.getCacheKey(userId, 'intentBreakdown', periodString);

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<IntentBreakdownOutput>(cacheKey);
    if (cachedResult) return cachedResult;

    const transactions = await this.fetchTransactionsByPeriod(
      userId,
      start,
      end,
      { intent: true, amount: true, amountInUsd: true },
      { type: TransactionType.EXPENSE },
    );

    const { totals: intentTotals, grandTotal } = this.calculateTransactionTotals(transactions, 'intent');

    const result: IntentBreakdownOutput = {
      period: periodString,
      intents: this.mapIntentTotalsToBreakdownItems(intentTotals, grandTotal),
      grandTotalIrt: grandTotal.irt,
      grandTotalUsd: grandTotal.usd,
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, result, ANALYTICS_CONSTANT.CACHE.TTL.INTENT_BREAKDOWN);

    return result;
  }

  /**
   * Analyzes transaction patterns by emotion for a user in a given period
   */
  async getEmotionBreakdown(userId: string, period?: string): Promise<EmotionBreakdownOutput> {
    const { start, end, periodString } = calculatePeriodRange(period);
    const cacheKey = this.getCacheKey(userId, 'emotionBreakdown', periodString);

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<EmotionBreakdownOutput>(cacheKey);
    if (cachedResult) return cachedResult;

    const transactions = await this.fetchTransactionsByPeriod(
      userId,
      start,
      end,
      { emotion: true, amount: true, amountInUsd: true },
      { type: TransactionType.EXPENSE },
    );

    const { totals: emotionTotals, grandTotal } = this.calculateTransactionTotals(transactions, 'emotion');

    const result: EmotionBreakdownOutput = {
      period: periodString,
      emotions: this.mapEmotionTotalsToBreakdownItems(emotionTotals, grandTotal),
      grandTotalIrt: grandTotal.irt,
      grandTotalUsd: grandTotal.usd,
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, result, ANALYTICS_CONSTANT.CACHE.TTL.EMOTION_BREAKDOWN);

    return result;
  }

  /**
   * Calculates the savings rate percentage for a user in a given period
   */
  async getSavingsRate(userId: string, period?: string): Promise<SavingsRateOutput> {
    const { periodString } = calculatePeriodRange(period);
    const cacheKey = this.getCacheKey(userId, 'savingsRate', periodString);

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<SavingsRateOutput>(cacheKey);
    if (cachedResult) return cachedResult;

    const netBalanceResult = await this.getNetBalance(userId, period);
    const savingsRatePercent = this.calculateSavingsRatePercentage(
      netBalanceResult.totalIncome.irt,
      netBalanceResult.totalExpense.irt,
    );

    const result: SavingsRateOutput = {
      period: netBalanceResult.period,
      savingsRatePercent,
      totalIncome: netBalanceResult.totalIncome,
      totalExpense: netBalanceResult.totalExpense,
      savingsAmount: netBalanceResult.netBalance,
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, result, ANALYTICS_CONSTANT.CACHE.TTL.SAVINGS_RATE);

    return result;
  }

  /**
   * Retrieves the top transactions by amount for a user in a given period
   */
  async getTopTransactions(
    userId: string,
    period?: string,
    take: number = ANALYTICS_CONSTANT.DEFAULT_TOP_TRANSACTIONS_LIMIT,
  ): Promise<TopTransactionsOutput> {
    const { start, end, periodString } = calculatePeriodRange(period);
    const cacheKey = this.getCacheKey(userId, 'topTransactions', periodString, take.toString());

    // Try to get from cache first
    const cachedResult = await this.cacheManager.get<TopTransactionsOutput>(cacheKey);
    if (cachedResult) return cachedResult;

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, type: TransactionType.EXPENSE, occurredAt: { gte: start, lt: end } },
      orderBy: { amount: 'desc' },
      take,
      select: { amount: true, amountInUsd: true, category: true, type: true, note: true, occurredAt: true },
    });

    const result: TopTransactionsOutput = {
      period: periodString,
      transactions: transactions as TopTransactionItem[],
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, result, ANALYTICS_CONSTANT.CACHE.TTL.TOP_TRANSACTIONS);

    return result;
  }

  // ==================== CACHE HELPER METHODS ====================

  /**
   * Generates a cache key for analytics data
   */
  private getCacheKey(userId: string, method: string, period?: string, additionalParams?: string): string {
    const periodKey = period || 'current';
    const paramsKey = additionalParams ? `:${additionalParams}` : '';
    return `${ANALYTICS_CONSTANT.CACHE.KEY_PREFIX}${method}:${userId}:${periodKey}${paramsKey}`;
  }

  /**
   * Invalidates all analytics cache entries for a user
   * This should be called when transactions are created, updated, or deleted
   */
  async invalidateUserAnalyticsCache(userId: string): Promise<void> {
    const patterns = [
      `${ANALYTICS_CONSTANT.CACHE.KEY_PREFIX}netBalance:${userId}:*`,
      `${ANALYTICS_CONSTANT.CACHE.KEY_PREFIX}spendingBreakdown:${userId}:*`,
      `${ANALYTICS_CONSTANT.CACHE.KEY_PREFIX}intentBreakdown:${userId}:*`,
      `${ANALYTICS_CONSTANT.CACHE.KEY_PREFIX}emotionBreakdown:${userId}:*`,
      `${ANALYTICS_CONSTANT.CACHE.KEY_PREFIX}savingsRate:${userId}:*`,
      `${ANALYTICS_CONSTANT.CACHE.KEY_PREFIX}topTransactions:${userId}:*`,
    ];

    // Note: Redis pattern deletion would require additional implementation
    // For now, we'll rely on TTL expiration
    // In a production environment, you might want to implement pattern-based cache invalidation
  }

  /**
   * Invalidates specific analytics cache entries for a user and period
   * This is more efficient than invalidating all cache entries
   */
  async invalidateUserPeriodAnalyticsCache(userId: string, period?: string): Promise<void> {
    const { periodString } = calculatePeriodRange(period);

    const cacheKeys = [
      this.getCacheKey(userId, 'netBalance', periodString),
      this.getCacheKey(userId, 'spendingBreakdown', periodString),
      this.getCacheKey(userId, 'intentBreakdown', periodString),
      this.getCacheKey(userId, 'emotionBreakdown', periodString),
      this.getCacheKey(userId, 'savingsRate', periodString),
    ];

    // Delete specific cache entries
    await Promise.all(cacheKeys.map((key) => this.cacheManager.del(key)));

    // For topTransactions, we need to delete all possible take values
    // This is a limitation of the current cache key structure
    // In production, you might want to use a different strategy
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Fetches transactions for a user within a specific period
   */
  private async fetchTransactionsByPeriod(userId: string, start: Date, end: Date, select: any, additionalWhere?: any) {
    const whereClause = { userId, occurredAt: { gte: start, lt: end }, ...additionalWhere };

    return await this.prisma.transaction.findMany({ where: whereClause, select });
  }

  /**
   * Calculates total income and expense amounts from transactions
   */
  private calculateIncomeAndExpenseTotals(transactions: any[]): {
    totalIncome: TransactionAmounts;
    totalExpense: TransactionAmounts;
  } {
    let totalIncomeIrt = 0;
    let totalIncomeUsd = 0;
    let totalExpenseIrt = 0;
    let totalExpenseUsd = 0;

    for (const tx of transactions) {
      if (tx.type === TransactionType.INCOME) {
        totalIncomeIrt += tx.amount;
        totalIncomeUsd += tx.amountInUsd;
      } else {
        totalExpenseIrt += tx.amount;
        totalExpenseUsd += tx.amountInUsd;
      }
    }

    return {
      totalIncome: { irt: totalIncomeIrt, usd: totalIncomeUsd },
      totalExpense: { irt: totalExpenseIrt, usd: totalExpenseUsd },
    };
  }

  /**
   * Calculates net balance from income and expense totals
   */
  private calculateNetBalance(totalIncome: TransactionAmounts, totalExpense: TransactionAmounts): TransactionAmounts {
    return {
      irt: totalIncome.irt - totalExpense.irt,
      usd: Number((totalIncome.usd - totalExpense.usd).toFixed(2)),
    };
  }

  /**
   * Calculates transaction totals grouped by a specific field
   */
  private calculateTransactionTotals(
    transactions: any[],
    groupByField: string,
  ): { totals: TransactionTotals; grandTotal: TransactionAmounts } {
    const totals: TransactionTotals = {};
    let grandTotalIrt = 0;
    let grandTotalUsd = 0;

    for (const tx of transactions) {
      const key = tx[groupByField];

      if (!totals[key]) totals[key] = { irt: 0, usd: 0 };

      totals[key].irt += tx.amount;
      totals[key].usd += tx.amountInUsd;
      grandTotalIrt += tx.amount;
      grandTotalUsd += tx.amountInUsd;
    }

    return {
      totals,
      grandTotal: { irt: grandTotalIrt, usd: grandTotalUsd },
    };
  }

  /**
   * Maps category totals to breakdown items with percentages
   */
  private mapCategoryTotalsToBreakdownItems(totals: TransactionTotals, grandTotal: TransactionAmounts) {
    return Object.entries(totals).map(([key, amounts]) => ({
      category: key as TransactionCategory,
      totalIrt: amounts.irt,
      totalUsd: amounts.usd,
      percentage: grandTotal.irt > 0 ? (amounts.irt / grandTotal.irt) * ANALYTICS_CONSTANT.PERCENTAGE_MULTIPLIER : 0,
    }));
  }

  /**
   * Maps intent totals to breakdown items with percentages
   */
  private mapIntentTotalsToBreakdownItems(totals: TransactionTotals, grandTotal: TransactionAmounts) {
    return Object.entries(totals).map(([key, amounts]) => ({
      intent: key as TransactionIntent,
      totalIrt: amounts.irt,
      totalUsd: amounts.usd,
      percentage: grandTotal.irt > 0 ? (amounts.irt / grandTotal.irt) * ANALYTICS_CONSTANT.PERCENTAGE_MULTIPLIER : 0,
    }));
  }

  /**
   * Maps emotion totals to breakdown items with percentages
   */
  private mapEmotionTotalsToBreakdownItems(totals: TransactionTotals, grandTotal: TransactionAmounts) {
    return Object.entries(totals).map(([key, amounts]) => ({
      emotion: key as TransactionEmotion,
      totalIrt: amounts.irt,
      totalUsd: amounts.usd,
      percentage: grandTotal.irt > 0 ? (amounts.irt / grandTotal.irt) * ANALYTICS_CONSTANT.PERCENTAGE_MULTIPLIER : 0,
    }));
  }

  /**
   * Calculates savings rate percentage
   */
  private calculateSavingsRatePercentage(totalIncome: number, totalExpense: number): number {
    return totalIncome > 0
      ? Number((((totalIncome - totalExpense) / totalIncome) * ANALYTICS_CONSTANT.PERCENTAGE_MULTIPLIER).toFixed(2))
      : 0;
  }
}
