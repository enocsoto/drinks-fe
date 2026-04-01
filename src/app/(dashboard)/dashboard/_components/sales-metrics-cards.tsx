'use client';

import { useMemo } from 'react';
import type {
  TodaySalesResponse,
  SalesByBeverageResponse,
  BeverageBreakdownItem,
  SalesByPeriodResponse,
} from '@/types/analytics.types';
import { CONTAINER_TYPE_LABELS } from '@/types/beverage.types';
import type { ContainerType } from '@/types/beverage.types';
import { monthOverMonthPct } from '../_utils/dashboard-trends';
import { SkeletonCard } from './skeleton-card';
import { cn } from '@/lib/utils';

interface Props {
  todaySales: TodaySalesResponse | null;
  beverageDay: SalesByBeverageResponse | null;
  beverageMonth: SalesByBeverageResponse | null;
  period: SalesByPeriodResponse | null;
  periodTab: number;
  loading: boolean;
}

const PERIOD_LABELS = [
  { title: 'Unidades hoy', amountTitle: 'Recaudación hoy', hint: 'Cierre del día' },
  { title: 'Últimos 7 días', amountTitle: 'Recaudación (7 días)', hint: 'Ventana móvil' },
  { title: 'Últimos 30 días', amountTitle: 'Recaudación (30 días)', hint: 'Ventana móvil' },
  { title: 'Acumulado del año', amountTitle: 'Recaudación del año', hint: `Año ${new Date().getFullYear()}` },
] as const;

function getYearTotal(data: SalesByBeverageResponse | null): number {
  return data?.totalTicketSales ?? 0;
}

function getCustomPeriodTotal(breakdown: BeverageBreakdownItem[], days: number): number {
  if (!breakdown?.length) return 0;
  const series = breakdown[0].series ?? [];
  const lastN = series.slice(-days);
  const labels = lastN.map((s) => s.label);
  return breakdown.reduce((sum, b) => {
    return (
      sum +
      (b.series ?? []).reduce((acc, s) => (labels.includes(s.label) ? acc + s.count : acc), 0)
    );
  }, 0);
}

function getCustomPeriodAmount(breakdown: BeverageBreakdownItem[], days: number): number {
  if (!breakdown?.length) return 0;
  const series = breakdown[0].series ?? [];
  const lastN = series.slice(-days);
  const labelSet = new Set(lastN.map((s) => s.label));
  let total = 0;
  for (const b of breakdown) {
    for (const p of b.series ?? []) {
      if (labelSet.has(p.label)) total += p.amount ?? 0;
    }
  }
  return Math.round(total);
}

function formatPresentation(containerType?: string, containerSize?: string): string {
  if (containerType && containerType in CONTAINER_TYPE_LABELS) {
    return CONTAINER_TYPE_LABELS[containerType as ContainerType];
  }
  if (containerSize) return containerSize;
  return '';
}

function getTopBeverage(breakdown: BeverageBreakdownItem[]): { name: string; presentation: string; count: number } | null {
  if (!breakdown?.length) return null;
  const top = breakdown[0];
  const presentation = formatPresentation(top.containerType, top.containerSize);
  return { name: top.name, presentation, count: top.count };
}

function getTopBeverageInPeriod(
  breakdown: BeverageBreakdownItem[],
  days: number,
): { name: string; presentation: string; count: number } | null {
  if (!breakdown?.length) return null;
  const series = breakdown[0].series ?? [];
  const lastN = series.slice(-days);
  const labels = new Set(lastN.map((s) => s.label));

  let top: BeverageBreakdownItem | null = null;
  let topCount = 0;

  for (const b of breakdown) {
    const sum = (b.series ?? []).reduce((acc, s) => (labels.has(s.label) ? acc + s.count : acc), 0);
    if (sum > topCount) {
      topCount = sum;
      top = b;
    }
  }

  if (!top) return null;
  const presentation = formatPresentation(top.containerType, top.containerSize);
  return { name: top.name, presentation, count: topCount };
}

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

function TrendLine({ pct, show }: { pct: number | null; show: boolean }) {
  if (!show || pct === null) {
    return <span className="text-xs text-[var(--text-muted)]">—</span>;
  }
  const up = pct > 0;
  const down = pct < 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        up && 'text-[var(--success)]',
        down && 'text-[var(--error)]',
        !up && !down && 'text-[var(--text-muted)]',
      )}
    >
      {up ? (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ) : down ? (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ) : null}
      {pct > 0 ? '+' : ''}
      {pct}% vs mes anterior
    </span>
  );
}

function KpiCard({
  title,
  value,
  subline,
  trendPct,
  showTrend,
  icon,
  iconBg,
}: {
  title: string;
  value: React.ReactNode;
  subline?: string;
  trendPct: number | null;
  showTrend: boolean;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="dashboard-card relative flex flex-col gap-3 overflow-hidden p-6 md:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">{value}</p>
          {subline && <p className="text-xs text-[var(--text-secondary)]">{subline}</p>}
          <div className="pt-1">
            <TrendLine pct={trendPct} show={showTrend} />
          </div>
        </div>
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[var(--text-on-brand)]"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function SalesMetricsCards({
  todaySales,
  beverageDay,
  beverageMonth,
  period,
  periodTab,
  loading,
}: Props) {
  const series = period?.series ?? [];
  const momCount = monthOverMonthPct(series, 'count');
  const momAmount = monthOverMonthPct(series, 'amount');
  const showMom = periodTab >= 2;

  const metrics = useMemo(() => {
    const isDiario = periodTab === 0;
    const isSemanal = periodTab === 1;
    const isMensual = periodTab === 2;

    const topBev = isDiario
      ? getTopBeverageInPeriod(beverageDay?.breakdown ?? [], 1)
      : isSemanal
        ? getTopBeverageInPeriod(beverageDay?.breakdown ?? [], 7)
        : isMensual
          ? getTopBeverageInPeriod(beverageDay?.breakdown ?? [], 31)
          : getTopBeverage(beverageMonth?.breakdown ?? []);

    const units =
      isDiario
        ? (todaySales?.totalSales ?? 0)
        : isSemanal
          ? getCustomPeriodTotal(beverageDay?.breakdown ?? [], 7)
          : isMensual
            ? getCustomPeriodTotal(beverageDay?.breakdown ?? [], 31)
            : getYearTotal(beverageMonth);

    const amount =
      isDiario
        ? (todaySales?.totalAmount ?? 0)
        : isSemanal
          ? getCustomPeriodAmount(beverageDay?.breakdown ?? [], 7)
          : isMensual
            ? getCustomPeriodAmount(beverageDay?.breakdown ?? [], 31)
            : (beverageMonth?.totalAmount ?? 0);

    return { topBev, units, amount };
  }, [periodTab, todaySales, beverageDay, beverageMonth]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} rows={2} />
        ))}
      </div>
    );
  }

  const labels = PERIOD_LABELS[periodTab] ?? PERIOD_LABELS[2];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <KpiCard
        title={labels.title}
        value={metrics.units.toLocaleString('es-CO')}
        subline={labels.hint}
        trendPct={momCount}
        showTrend={showMom}
        iconBg="var(--brand-primary)"
        icon={
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        }
      />

      <KpiCard
        title={labels.amountTitle}
        value={formatCOP(metrics.amount)}
        subline={labels.hint}
        trendPct={momAmount}
        showTrend={showMom}
        iconBg="var(--text-secondary)"
        icon={
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />

      <KpiCard
        title="Bebida destacada"
        value={
          metrics.topBev ? (
            <span className="line-clamp-2 text-xl md:text-2xl">{metrics.topBev.name}</span>
          ) : (
            '—'
          )
        }
        subline={
          metrics.topBev
            ? `${metrics.topBev.count.toLocaleString('es-CO')} uds · ${metrics.topBev.presentation || '—'}`
            : 'Sin ventas en el período'
        }
        trendPct={null}
        showTrend={false}
        iconBg="var(--warning)"
        icon={
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        }
      />
    </div>
  );
}
