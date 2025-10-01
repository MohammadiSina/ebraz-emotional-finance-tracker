export const EXCHANGE_RATES_CONSTANT = {
  CACHE_KEY_PREFIX: 'ebraz:rates:',

  CURRENCY_PAIRS: {
    USD_IRT: 'USDIRT',
  },

  LENGTH: {
    CURRENCY_PAIR: { MIN: 6, MAX: 6 },
  },

  API: {
    BITPIN_MARKET_PRICE_URL: 'https://api.bitpin.org/api/v1/mkt/tickers/',
    BITPIN_USDT_IRT_SYMBOL: 'USDT_IRT',
  },

  ERROR: {
    EXCHANGE_RATE_NOT_FOUND: (code: string) => `Exchange rate with code '${code}' not found.`,
    EXCHANGE_RATE_NOT_RETRIEVED: 'Retrieving exchange rate from the externalAPI failed.',
    API_REQUEST_FAILED: 'Failed to fetch exchange rates from API',
    CURRENCY_PAIR_EMPTY: 'Currency pair must be a non-empty string',
    RATE_NOT_POSITIVE: 'Rate must be a positive number',
  },
};
