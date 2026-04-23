'use client';

import type { TransactionsResponse } from '@/types/analytics.types';
import { SkeletonCard } from './skeleton-card';

interface Props {
  data: TransactionsResponse | null;
  loading: boolean;
  onRefresh?: () => void;
}

export function TransactionsCard({ data, loading, onRefresh }: Props) {
  if (loading) return <SkeletonCard rows={5} />;

  const total = data?.total ?? 0;
  const completed = data?.completed.count ?? 0;
  const pending = data?.pending.count ?? 0;

  const rows = [
    {
      id: '1',
      label: 'Ventas completadas',
      status: 'Completado',
      count: completed,
      variant: 'success' as const,
    },
    {
      id: '2',
      label: 'Pendientes',
      status: 'Pendiente',
      count: pending,
      variant: 'warning' as const,
    },
  ];

  return (
    <div className="dashboard-card flex flex-col gap-5 p-6 md:p-7">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">Actividad del día</h2>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-base)]/50">
        <table className="table-zebra w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <th className="px-4 py-3 font-medium">Concepto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Cantidad</th>
              <th className="w-10 px-2 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={[
                  'border-b border-[var(--border)]/80 transition-colors last:border-0 hover:bg-[var(--bg-elevated)]',
                  i % 2 === 1 ? 'bg-[var(--bg-surface)]/40' : '',
                ].join(' ')}
              >
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{row.label}</td>
                <td className="px-4 py-3">
                  {row.variant === 'success' ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[var(--success)]">
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {row.status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[var(--warning)]">
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {row.status}
                    </span>
                  )}
                </td>
                <td
                  className={[
                    'px-4 py-3 text-right font-bold tabular-nums',
                    row.variant === 'success' ? 'text-[var(--success)]' : 'text-[var(--warning)]',
                  ].join(' ')}
                >
                  {row.count.toLocaleString('es-CO')}
                </td>
                <td className="px-2 py-3 text-[var(--text-muted)]">
                  <button type="button" className="rounded p-1 hover:bg-[var(--border)]/40" aria-label="Más opciones">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
        <span className="text-xs text-[var(--text-muted)]">Total tickets hoy</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-xs font-medium text-[var(--brand-primary)] hover:opacity-80"
            onClick={() => (onRefresh ? onRefresh() : window.location.reload())}
          >
            Actualizar
          </button>
          <span className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{total.toLocaleString('es-CO')}</span>
        </div>
      </div>
    </div>
  );
}
