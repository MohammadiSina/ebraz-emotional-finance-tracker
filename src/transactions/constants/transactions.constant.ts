export const TRANSACTION_CONSTANT = {
  LENGTH: {
    AMOUNT: { MIN: 0, MAX: 1000000000000 },
    CURRENCY: { MIN: 3, MAX: 4 },
    NOTE: { MIN: 0, MAX: 500 },
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
    CURRENCY: 'Currency code (e.g., USD, EUR) for the transaction amount',
    CATEGORY: 'Category of the transaction (e.g., DAILY_EXPENSES, TRANSPORTATION)',
    INTENT: 'Intent of the transaction (e.g., PLANNED, IMPULSE, OBLIGATION)',
    EMOTION: 'Emotion associated with the transaction (e.g., Regret, Satisfaction, etc.)',
    NOTE: 'Optional note or reflection about the transaction, used by AI for insights',
    OCCURRED_AT: 'Timestamp indicating when the transaction took place',
    CREATED_AT: 'Timestamp indicating when the user account was first created in the system',
    UPDATED_AT: 'Timestamp indicating when the user account was updated the last time',
  },
};
