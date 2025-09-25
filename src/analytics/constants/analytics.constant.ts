import { COMMON_CONSTANT } from '../../common/constants/common.constant';

export const ANALYTICS_CONSTANT = {
  DEFAULT_TOP_TRANSACTIONS_LIMIT: 5,
  PERCENTAGE_MULTIPLIER: 100,

  ERROR: {
    PERIOD_FORMAT: COMMON_CONSTANT.ERROR.PERIOD_FORMAT,
  },

  FIELD_DESCRIPTION: {
    PERIOD: COMMON_CONSTANT.FIELD_DESCRIPTION.PERIOD,
    TOTAL_INCOME: 'Total income for the selected period',
    TOTAL_EXPENSE: 'Total expenses for the selected period',
    NET_BALANCE: 'Net balance (income - expenses)',
    SPENDING_BREAKDOWN_BY_CATEGORY: 'Spending breakdown by category',
    INTENT_BREAKDOWN_BY_INTENT: 'Spending breakdown by intent',
    GRAND_TOTAL_IRT: 'Total spending for all categories in the selected period in IRT',
    GRAND_TOTAL_USD: 'Total spending for all categories in the selected period in USD',
    USD: 'Amount in USD',
    IRT: 'Amount in IRT',
    CATEGORY: 'Transaction category (comes from the TransactionCategory enum)',
    PERCENTAGE: 'Percentage of total spending in an specific category',
    INTENT: 'Transaction intent (comes from the TransactionIntent enum)',
    EMOTION: 'Transaction emotion (comes from the TransactionEmotion enum)',
    EMOTION_BREAKDOWN_BY_EMOTION: 'Spending breakdown by emotion',
    SAVINGS_RATE_PERCENT: 'Savings rate as percentage (0-100)',
    SAVINGS_AMOUNT: 'Savings amount (income - expenses)',
  },

  RESOLVER_DESCRIPTION: {
    GET_NET_BALANCE: 'Get net balance for a specific period',
    GET_SPENDING_BREAKDOWN: 'Get spending breakdown by category for a specific period',
    GET_INTENT_BREAKDOWN: 'Get spending breakdown by intent for a specific period',
    GET_EMOTION_BREAKDOWN: 'Get spending breakdown by emotion for a specific period',
    GET_SAVINGS_RATE: 'Get savings rate for a specific period',
    GET_TOP_TRANSACTIONS: 'Get top transactions for a specific period',
  },
};
