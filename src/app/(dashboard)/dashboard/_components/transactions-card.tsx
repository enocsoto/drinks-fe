'use client';

import type { TransactionsResponse } from '@/types/analytics.types';
import { SkeletonCard } from './skeleton-card';

interface Props {
  data: TransactionsResponse | null;
  loading: boolean;
  onRefresh?: () => void;
}

interface TransactionRow {
  label: string;
  percentage: number;
  count: number;
  color: string;
  tooltip: string;
}

export function TransactionsCard({ data, loading, onRefresh }: Props) {
  if (loading) return <SkeletonCard rows={3} />;

  const total = data?.total ?? 0;

  const rows: TransactionRow[] = [
    {
      label: 'Ventas Completadas',
      percentage: data?.completed.percentage ?? 0,
      count: data?.completed.count ?? 0,
      color: 'var(--brand-primary)',
      tooltip: 'Cantidad de ventas (tickets) registradas hoy.',
    },
    {
      label: 'Pendientes',
      percentage: data?.pending.percentage ?? 0,
      count: data?.pending.count ?? 0,
      color: 'var(--text-muted)',
      tooltip: 'En este sistema no hay ventas pendientes; todas se registran como completadas.',
    },
  ];

  return (
    <div className="glass p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-[var(--bg-surface)] flex items-center justify-center text-[10px]">$</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Transacciones del Día</span>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-[var(--brand-primary)] hover:opacity-75 transition-opacity disabled:opacity-50"
          onClick={() => (onRefresh ? onRefresh() : window.location.reload())}
          title="Actualizar datos del dashboard"
        >
          Actualizar
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 text-xs text-[var(--text-muted)] font-medium">
        <span>Tipo</span>
        <span className="text-right">%</span>
        <span className="text-right">Cant.</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-3 items-center text-sm">
            <span className="text-[var(--text-secondary)] truncate cursor-help" title={row.tooltip}>
              {row.label}
            </span>
            <span className="text-right font-medium text-[var(--text-primary)]">{row.percentage.toFixed(1)}%</span>
            <span className="text-right font-semibold text-[var(--text-primary)]">{row.count}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">Total del día</span>
        <span className="text-lg font-bold text-[var(--text-primary)]">{total}</span>
      </div>
    </div>
  );
}
