'use client';

import { useState, useMemo } from 'react';
import type {
  TodaySalesResponse,
  SalesByBeverageResponse,
  BeverageBreakdownItem,
} from '@/types/analytics.types';
import { CONTAINER_TYPE_LABELS } from '@/types/beverage.types';
import type { ContainerType } from '@/types/beverage.types';
import { SkeletonCard } from './skeleton-card';

interface Props {
  todaySales: TodaySalesResponse | null;
  beverageDay: SalesByBeverageResponse | null;
  beverageMonth: SalesByBeverageResponse | null;
  loading: boolean;
}

const PERIOD_TABS = ['Diario', 'Semanal', 'Mensual', 'Anual'] as const;

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

function formatPresentation(containerType?: string, containerSize?: string): string {
  if (containerType && containerType in CONTAINER_TYPE_LABELS) {
    return CONTAINER_TYPE_LABELS[containerType as ContainerType];
  }
  if (containerSize) return containerSize;
  return '';
}

function getTopBeverage(
  breakdown: BeverageBreakdownItem[],
): { name: string; presentation: string; count: number } | null {
  if (!breakdown?.length) return null;
  const top = breakdown[0];
  const presentation = formatPresentation(top.containerType, top.containerSize);
  return {
    name: top.name,
    presentation,
    count: top.count,
  };
}

/** Top bebida en los últimos N días (ventana móvil) */
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

function MetricCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: string;
  title: string;
  value: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="glass p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-semibold text-[var(--text-secondary)]">{title}</span>
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
      {subtitle && <p className="text-[10px] text-[var(--text-muted)]">{subtitle}</p>}
    </div>
  );
}

const PERIOD_LABELS = {
  Diario: { title: 'Ventas del día', subtitle: 'Unidades hoy', icon: '📅' },
  Semanal: { title: 'Ventas de la semana', subtitle: 'Últimos 7 días', icon: '📆' },
  Mensual: { title: 'Ventas del mes', subtitle: 'Últimos 31 días', icon: '🗓️' },
  Anual: { title: 'Ventas del año', subtitle: 'Unidades este año', icon: '🗓️' },
} as const;

export function SalesMetricsCards({
  todaySales,
  beverageDay,
  beverageMonth,
  loading,
}: Props) {
  const [activePeriod, setActivePeriod] = useState(0); // Diario

  const periodData = useMemo(() => {
    const isDiario = activePeriod === 0;
    const isSemanal = activePeriod === 1;
    const isMensual = activePeriod === 2;

    // Bebida más vendida: ventana móvil para Diario/Semanal/Mensual, datos completos para Anual
    const topBev =
      isDiario
        ? getTopBeverageInPeriod(beverageDay?.breakdown ?? [], 1)
        : isSemanal
          ? getTopBeverageInPeriod(beverageDay?.breakdown ?? [], 7)
          : isMensual
            ? getTopBeverageInPeriod(beverageDay?.breakdown ?? [], 31)
            : getTopBeverage(beverageMonth?.breakdown ?? []);

    // Ventanas móviles para consistencia: Semanal ≤ Mensual ≤ Anual
    const total =
      isDiario
        ? (todaySales?.totalSales ?? 0)
        : isSemanal
          ? getCustomPeriodTotal(beverageDay?.breakdown ?? [], 7)
          : isMensual
            ? getCustomPeriodTotal(beverageDay?.breakdown ?? [], 31)
            : getYearTotal(beverageMonth);

    const tab = PERIOD_TABS[activePeriod];
    const labels = PERIOD_LABELS[tab];

    return {
      topBeverage: topBev,
      total,
      labels,
    };
  }, [activePeriod, todaySales, beverageDay, beverageMonth]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-64 bg-[var(--border)] rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} rows={2} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de período (mismo estilo que SalesBreakdownCard) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Métricas de ventas</span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-surface)] rounded-lg p-1">
          {PERIOD_TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActivePeriod(i)}
              className={[
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                activePeriod === i
                  ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Bebida más vendida */}
        <MetricCard
          icon="🍺"
          title="Bebida más vendida"
          value={
            periodData.topBeverage ? (
              <>
                {periodData.topBeverage.name}
                {periodData.topBeverage.presentation && (
                  <span className="text-sm font-normal text-[var(--text-secondary)]">
                    {' '}({periodData.topBeverage.presentation})
                  </span>
                )}
              </>
            ) : (
              '—'
            )
          }
          subtitle={
            periodData.topBeverage
              ? `${periodData.topBeverage.count.toLocaleString('es-CO')} uds vendidas`
              : 'Sin ventas'
          }
        />

        {/* Total ventas (según período seleccionado) */}
        <MetricCard
          icon={periodData.labels.icon}
          title={periodData.labels.title}
          value={periodData.total.toLocaleString('es-CO')}
          subtitle={periodData.labels.subtitle}
        />
      </div>
    </div>
  );
}
