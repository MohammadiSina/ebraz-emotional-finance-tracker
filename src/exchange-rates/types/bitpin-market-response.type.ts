export type BitpinMarketResponse = IBitpinCurrencyPair[];

interface IBitpinCurrencyPair {
  symbol: string;
  price: string;
  daily_change_price: number;
  low: string;
  high: string;
  timestamp: number;
}
