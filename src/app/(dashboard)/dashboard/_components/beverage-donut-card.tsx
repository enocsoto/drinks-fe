'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { SalesByBeverageResponse, BeverageBreakdownItem } from '@/types/analytics.types';
import { SkeletonCard } from './skeleton-card';
import {
  breakdownForDonut,
  getDashboardUnits,
} from '../_utils/dashboard-beverage-metrics';

interface Props {
  periodTab: number;
  beverageDay: SalesByBeverageResponse | null;
  beverageMonth: SalesByBeverageResponse | null;
  loading: boolean;
}

const PERIOD_TOTAL_LABELS = [
  'Unidades · hoy',
  'Unidades · últimos 7 días',
  'Unidades · últimos 30 días',
  'Unidades · año en curso',
] as const;

const SEGMENT_COLORS = [
  'var(--brand-primary)',
  'var(--text-secondary)',
  'var(--warning)',
  'var(--success)',
  '#94a3b8',
];

function buildDonutData(breakdown: BeverageBreakdownItem[]) {
  if (!breakdown.length) return [];
  const sorted = [...breakdown].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, 4);
  const rest = sorted.slice(4);
  const otherCount = rest.reduce((s, b) => s + b.count, 0);
  const otherPct = rest.reduce((s, b) => s + b.percentage, 0);
  const rows = top.map((b, i) => ({
    id: b.beverageId,
    name: b.name,
    value: b.percentage,
    count: b.count,
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
  }));
  if (otherCount > 0) {
    rows.push({
      id: '__others__',
      name: 'Otros',
      value: Math.round(otherPct * 10) / 10,
      count: otherCount,
      color: SEGMENT_COLORS[4],
    });
  }
  return rows;
}

export function BeverageDonutCard({ periodTab, beverageDay, beverageMonth, loading }: Props) {
  const windowBreakdown = useMemo(
    () => breakdownForDonut(periodTab, beverageDay, beverageMonth),
    [periodTab, beverageDay, beverageMonth],
  );

  const total = useMemo(
    () => getDashboardUnits(periodTab, beverageDay, beverageMonth),
    [periodTab, beverageDay, beverageMonth],
  );

  const chartData = useMemo(() => buildDonutData(windowBreakdown), [windowBreakdown]);

  const totalLabel =
    periodTab >= 0 && periodTab < PERIOD_TOTAL_LABELS.length
      ? PERIOD_TOTAL_LABELS[periodTab]
      : PERIOD_TOTAL_LABELS[2];

  if (loading) {
    return <SkeletonCard rows={4} />;
  }

  return (
    <div className="dashboard-card flex flex-col gap-5 p-6 md:p-7">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">Desglose por bebida</h2>

      {chartData.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Sin datos del período</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {chartData.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: row.color }}
                    aria-hidden
                  />
                  <span className="truncate text-[var(--text-secondary)]">{row.name}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-[var(--text-primary)]">
                  {row.value}%
                </span>
              </li>
            ))}
          </ul>

          <div className="relative mx-auto aspect-square w-full max-w-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="100%"
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as { name: string; value: number; count: number };
                    return (
                      <div
                        className="rounded-lg border px-3 py-2 text-xs shadow-md"
                        style={{
                          background: 'var(--bg-elevated)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-[var(--text-muted)]">
                          {p.value}% · {p.count.toLocaleString('es-CO')} uds
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-[42%] w-[42%] flex-col items-center justify-center rounded-full bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]">
                <span className="max-w-[90%] text-center text-[10px] font-medium uppercase leading-tight tracking-wide text-[var(--text-muted)]">
                  {totalLabel}
                </span>
                <span className="text-lg font-bold tabular-nums text-[var(--text-primary)]">
                  {total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
