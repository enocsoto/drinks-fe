import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BeverageBreakdownItem } from '@/types/analytics.types';
import { getCustomPeriodTotal } from './dashboard-beverage-metrics';

const FIXED_NOW = new Date('2026-04-15T18:00:00.000Z');

describe('getCustomPeriodTotal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('si no hay punto de venta con etiqueta de hoy, ventana 1 día = 0 (ni usa el último punto de otra bebida)', () => {
    const breakdown: BeverageBreakdownItem[] = [
      {
        beverageId: 'a',
        name: 'Cerveza',
        count: 999,
        amount: 0,
        percentage: 0,
        series: [{ month: 0, year: 2026, label: '14/4', count: 50, amount: 500 }],
      },
    ];
    expect(getCustomPeriodTotal(breakdown, 1)).toBe(0);
  });

  it('ventana 1 día suma solo el count del día de hoy', () => {
    const breakdown: BeverageBreakdownItem[] = [
      {
        beverageId: 'a',
        name: 'Agua',
        count: 999,
        amount: 0,
        percentage: 0,
        series: [
          { month: 0, year: 2026, label: '14/4', count: 2, amount: 10 },
          { month: 0, year: 2026, label: '15/4', count: 3, amount: 15 },
        ],
      },
    ];
    expect(getCustomPeriodTotal(breakdown, 1)).toBe(3);
  });

  it('ventana 7 días suma puntos cuya etiqueta está en el calendario (9/4–15/4), excluye días fuera', () => {
    const breakdown: BeverageBreakdownItem[] = [
      {
        beverageId: 'a',
        name: 'Soda',
        count: 999,
        amount: 0,
        percentage: 0,
        series: [
          { month: 0, year: 2026, label: '8/4', count: 99, amount: 1 },
          { month: 0, year: 2026, label: '9/4', count: 2, amount: 2 },
          { month: 0, year: 2026, label: '15/4', count: 10, amount: 100 },
        ],
      },
    ];
    expect(getCustomPeriodTotal(breakdown, 7)).toBe(12);
  });
});
