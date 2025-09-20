export interface TransactionAmounts {
  irt: number;
  usd: number;
}

export interface TransactionTotals {
  [key: string]: TransactionAmounts;
}
