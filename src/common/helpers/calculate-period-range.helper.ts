import { PeriodRange } from '../types/period-range.interface';

/**
 * Calculates the start and end dates for a given period
 */
export function calculatePeriodRange(period?: string): PeriodRange {
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
