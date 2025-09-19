export const EXCHANGE_RATES_CONSTANT = {
  LENGTH: {
    CURRENCY_PAIR: { MIN: 6, MAX: 6 },
  },

  CACHE: {
    INTERNAL_EXCHANGE_RATE_EXPIRE_TIME: 1000 * 60 * 60 * 0.5, // 30 minutes
  },

  API: {
    BITPIN_MARKET_PRICE_URL: 'https://api.bitpin.org/api/v1/mkt/tickers/',
  },

  ERROR: {
    EXCHANGE_RATE_NOT_FOUND: (code: string) => `Exchange rate with code '${code}' not found.`,
  },
};
