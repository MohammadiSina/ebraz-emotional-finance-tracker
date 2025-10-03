import { INSIGHTS_CONSTANT } from '../../insights/constants/insights.constant';

export const TRANSACTION_CONSTANT = {
  LENGTH: {
    AMOUNT: { MIN: 0, MAX: 1000000000000 },
    CURRENCY: { MIN: 3, MAX: 3 },
    NOTE: { MIN: 0, MAX: 500 },
    INSIGHT_TRANSACTIONS: INSIGHTS_CONSTANT.LENGTH.INSIGHT_TRANSACTIONS,
  },

  CACHE: {
    KEY_PREFIX: 'ebraz:transactions:',
    TTL: {
      FIND_ALL: 300000, // 5 minutes
      FIND_ONE: 600000, // 10 minutes
      TOP_EXPENSE: 300000, // 5 minutes
    },
  },

  ERROR: {
    TRANSACTION_NOT_FOUND: (id: string) =>
      id
        ? `Transaction with ID '${id}' not found.`
        : 'The requested transaction could not be found. Please check your information and try again.',
  },

  FIELD_DESCRIPTION: {
    ID: 'Unique identifier (UUID) for the transaction',
    USER_ID: 'Unique identifier (UUID) for the user',
    TYPE: 'Type of the transaction (e.g., INCOME, EXPENSE)',
    AMOUNT: 'Monetary value associated with the transaction',
    CURRENCY: 'Currency code (e.g., USD, IRT) for the transaction amount',
    EXCHANGE_RATE: 'Exchange rate for the transaction amount',
    AMOUNT_IN_USD: 'Amount in USD for the transaction amount',
    CATEGORY: 'Category of the transaction (e.g., DAILY_EXPENSES, TRANSPORTATION)',
    INTENT: 'Intent of the transaction (e.g., PLANNED, IMPULSE, OBLIGATION)',
    EMOTION: 'Emotion associated with the transaction (e.g., Regret, Satisfaction, etc.)',
    NOTE: 'Optional note or reflection about the transaction, used by AI for insights',
    OCCURRED_AT: 'Timestamp indicating when the transaction took place',
    CREATED_AT: 'Timestamp indicating when the user account was first created in the system',
    UPDATED_AT: 'Timestamp indicating when the user account was updated the last time',
  },
};
