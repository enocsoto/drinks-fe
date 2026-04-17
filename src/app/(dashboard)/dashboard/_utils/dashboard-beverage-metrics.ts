import type { BeverageBreakdownItem, SalesByBeverageResponse } from '@/types/analytics.types';
import { getColombiaDayLabelSetForWindow } from '@/lib/date-colombia';

export function getYearTotal(data: SalesByBeverageResponse | null): number {
  return data?.totalTicketSales ?? 0;
}

/**
 * Suma unidades en la ventana usando etiquetas de calendario Colombia (`D/M`), no el último
 * punto de la serie de una bebida (si hoy no hubo ventas, ese día no aparece en `series` y
 * el último punto sería ayer — mal para “Hoy”).
 */
export function getCustomPeriodTotal(breakdown: BeverageBreakdownItem[], days: number): number {
  if (!breakdown?.length) return 0;
  const labelSet = getColombiaDayLabelSetForWindow(days);
  return breakdown.reduce((sum, b) => {
    return (
      sum +
      (b.series ?? []).reduce((acc, s) => (labelSet.has(s.label) ? acc + s.count : acc), 0)
    );
  }, 0);
}

export function getCustomPeriodAmount(breakdown: BeverageBreakdownItem[], days: number): number {
  if (!breakdown?.length) return 0;
  const labelSet = getColombiaDayLabelSetForWindow(days);
  let total = 0;
  for (const b of breakdown) {
    for (const p of b.series ?? []) {
      if (labelSet.has(p.label)) total += p.amount ?? 0;
    }
  }
  return Math.round(total);
}

/**
 * Misma regla que los KPI del dashboard: unidades vendidas según la pestaña de período.
 */
export function getDashboardUnits(
  periodTab: number,
  beverageDay: SalesByBeverageResponse | null,
  beverageMonth: SalesByBeverageResponse | null,
): number {
  const bd = beverageDay?.breakdown ?? [];
  if (periodTab === 0) return getCustomPeriodTotal(bd, 1);
  if (periodTab === 1) return getCustomPeriodTotal(bd, 7);
  if (periodTab === 2) return getCustomPeriodTotal(bd, 31);
  return getYearTotal(beverageMonth);
}

export function getDashboardRecaudacion(
  periodTab: number,
  beverageDay: SalesByBeverageResponse | null,
  beverageMonth: SalesByBeverageResponse | null,
): number {
  const bd = beverageDay?.breakdown ?? [];
  if (periodTab === 0) return getCustomPeriodAmount(bd, 1);
  if (periodTab === 1) return getCustomPeriodAmount(bd, 7);
  if (periodTab === 2) return getCustomPeriodAmount(bd, 31);
  return Math.round(beverageMonth?.totalAmount ?? 0);
}

export function buildBreakdownForLastNDays(
  breakdown: BeverageBreakdownItem[],
  days: number,
): BeverageBreakdownItem[] {
  if (!breakdown.length) return [];
  const labelSet = getColombiaDayLabelSetForWindow(days);
  const rows: BeverageBreakdownItem[] = [];

  for (const b of breakdown) {
    let count = 0;
    let amount = 0;
    for (const s of b.series ?? []) {
      if (labelSet.has(s.label)) {
        count += s.count;
        amount += s.amount ?? 0;
      }
    }
    if (count <= 0) continue;
    rows.push({
      ...b,
      count,
      amount: Math.round(amount * 100) / 100,
      percentage: 0,
      series: b.series,
    });
  }

  const total = rows.reduce((s, r) => s + r.count, 0);
  for (const r of rows) {
    r.percentage = total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0;
  }
  return rows.sort((a, b) => b.count - a.count);
}

export function breakdownForDonut(
  periodTab: number,
  beverageDay: SalesByBeverageResponse | null,
  beverageMonth: SalesByBeverageResponse | null,
): BeverageBreakdownItem[] {
  if (periodTab <= 2) {
    const bd = beverageDay?.breakdown ?? [];
    const days = periodTab === 0 ? 1 : periodTab === 1 ? 7 : 31;
    return buildBreakdownForLastNDays(bd, days);
  }
  return [...(beverageMonth?.breakdown ?? [])];
}

/**
 * Para granularidad semanal/mensual en gráficos: etiquetas vienen del API y no coinciden con D/M.
 */
export function getLongestSeriesInBreakdown(breakdown: BeverageBreakdownItem[]) {
  if (!breakdown.length) return [];
  let best = breakdown[0].series ?? [];
  for (const b of breakdown) {
    const s = b.series ?? [];
    if (s.length > best.length) best = s;
  }
  return best;
}
