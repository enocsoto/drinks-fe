import type { SeriesPoint } from '@/types/analytics.types';

export function monthOverMonthPct(series: SeriesPoint[] | undefined, field: 'count' | 'amount'): number | null {
  if (!series?.length || series.length < 2) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const a = field === 'count' ? last.count : last.amount;
  const b = field === 'count' ? prev.count : prev.amount;
  if (b === 0) return a > 0 ? 100 : null;
  return Math.round(((a - b) / b) * 1000) / 10;
}
