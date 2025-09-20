import { Injectable } from '@nestjs/common';
import { TransactionCategory, TransactionEmotion, TransactionIntent, TransactionType } from 'generated/prisma';
import { PrismaService } from '../../common/services/prisma.service';
import { ANALYTICS_CONSTANT } from '../constants/analytics.constant';
import { EmotionBreakdownOutput } from '../dto/emotion-breakdown.output';
import { IntentBreakdownOutput } from '../dto/intent-breakdown.output';
import { NetBalanceOutput } from '../dto/net-balance.output';
import { SavingsRateOutput } from '../dto/savings-rate.output';
import { SpendingBreakdownOutput } from '../dto/spending-breakdown.output';
import { TopTransactionItem, TopTransactionsOutput } from '../dto/top-transactions.output';
import { PeriodRange } from '../types/period-range.interface';
import { TransactionAmounts, TransactionTotals } from '../types/transaction-calculation.interface';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates the net balance (income - expenses) for a user in a given period
   */
  async getNetBalance(userId: string, period?: string): Promise<NetBalanceOutput> {
    const { start, end, periodString } = this.calculatePeriodRange(period);

    const transactions = await this.fetchTransactionsByPeriod(userId, start, end, {
      type: true,
      amount: true,
      amountInUsd: true,
    });

    const { totalIncome, totalExpense } = this.calculateIncomeAndExpenseTotals(transactions);

    return {
      period: periodString,
      netBalance: this.calculateNetBalance(totalIncome, totalExpense),
      totalIncome,
      totalExpense,
    };
  }

  /**
   * Analyzes spending patterns by category for a user in a given period
   */
  async getSpendingBreakdown(userId: string, period?: string): Promise<SpendingBreakdownOutput> {
    const { start, end, periodString } = this.calculatePeriodRange(period);

    const transactions = await this.fetchTransactionsByPeriod(
      userId,
      start,
      end,
      { category: true, amount: true, amountInUsd: true },
      { type: TransactionType.EXPENSE },
    );

    const { totals: categoryTotals, grandTotal } = this.calculateTransactionTotals(transactions, 'category');

    return {
      period: periodString,
      categories: this.mapCategoryTotalsToBreakdownItems(categoryTotals, grandTotal),
      grandTotalIrt: grandTotal.irt,
      grandTotalUsd: grandTotal.usd,
    };
  }

  /**
   * Analyzes transaction patterns by intent for a user in a given period
   */
  async getIntentBreakdown(userId: string, period?: string): Promise<IntentBreakdownOutput> {
    const { start, end, periodString } = this.calculatePeriodRange(period);

    const transactions = await this.fetchTransactionsByPeriod(
      userId,
      start,
      end,
      {
        intent: true,
        amount: true,
        amountInUsd: true,
      },
      { type: TransactionType.EXPENSE },
    );

    const { totals: intentTotals, grandTotal } = this.calculateTransactionTotals(transactions, 'intent');

    return {
      period: periodString,
      intents: this.mapIntentTotalsToBreakdownItems(intentTotals, grandTotal),
      grandTotalIrt: grandTotal.irt,
      grandTotalUsd: grandTotal.usd,
    };
  }

  /**
   * Analyzes transaction patterns by emotion for a user in a given period
   */
  async getEmotionBreakdown(userId: string, period?: string): Promise<EmotionBreakdownOutput> {
    const { start, end, periodString } = this.calculatePeriodRange(period);

    const transactions = await this.fetchTransactionsByPeriod(
      userId,
      start,
      end,
      {
        emotion: true,
        amount: true,
        amountInUsd: true,
      },
      { type: TransactionType.EXPENSE },
    );

    const { totals: emotionTotals, grandTotal } = this.calculateTransactionTotals(transactions, 'emotion');

    return {
      period: periodString,
      emotions: this.mapEmotionTotalsToBreakdownItems(emotionTotals, grandTotal),
      grandTotalIrt: grandTotal.irt,
      grandTotalUsd: grandTotal.usd,
    };
  }

  /**
   * Calculates the savings rate percentage for a user in a given period
   */
  async getSavingsRate(userId: string, period?: string): Promise<SavingsRateOutput> {
    const netBalanceResult = await this.getNetBalance(userId, period);
    const savingsRatePercent = this.calculateSavingsRatePercentage(
      netBalanceResult.totalIncome.irt,
      netBalanceResult.totalExpense.irt,
    );

    return {
      period: netBalanceResult.period,
      savingsRatePercent,
      totalIncome: netBalanceResult.totalIncome,
      totalExpense: netBalanceResult.totalExpense,
      savingsAmount: netBalanceResult.netBalance,
    };
  }

  /**
   * Retrieves the top transactions by amount for a user in a given period
   */
  async getTopTransactions(
    userId: string,
    period?: string,
    take: number = ANALYTICS_CONSTANT.DEFAULT_TOP_TRANSACTIONS_LIMIT,
  ): Promise<TopTransactionsOutput> {
    const { start, end, periodString } = this.calculatePeriodRange(period);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, type: TransactionType.EXPENSE, occurredAt: { gte: start, lt: end } },
      orderBy: { amount: 'desc' },
      take,
      select: { amount: true, amountInUsd: true, category: true, type: true, note: true, occurredAt: true },
    });

    return { period: periodString, transactions: transactions as TopTransactionItem[] };
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Calculates the start and end dates for a given period
   */
  private calculatePeriodRange(period?: string): PeriodRange {
    let start: Date;
    let end: Date;

    if (period) {
      const [year, month] = period.split('-').map(Number);
      start = new Date(Date.UTC(year, month - 1, 1));
      end = new Date(Date.UTC(year, month, 1));
    } else {
      const now = new Date();
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    }

    const periodString = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
    return { start, end, periodString };
  }

  /**
   * Fetches transactions for a user within a specific period
   */
  private async fetchTransactionsByPeriod(userId: string, start: Date, end: Date, select: any, additionalWhere?: any) {
    const whereClause = {
      userId,
      occurredAt: { gte: start, lt: end },
      ...additionalWhere,
    };

    return await this.prisma.transaction.findMany({
      where: whereClause,
      select,
    });
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
      usd: totalIncome.usd - totalExpense.usd,
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
      if (!totals[key]) {
        totals[key] = { irt: 0, usd: 0 };
      }
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
      ? ((totalIncome - totalExpense) / totalIncome) * ANALYTICS_CONSTANT.PERCENTAGE_MULTIPLIER
      : 0;
  }
}
