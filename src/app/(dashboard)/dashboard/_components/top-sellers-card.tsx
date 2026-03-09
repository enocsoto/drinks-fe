'use client';

import type { TopSellerItem } from '@/types/analytics.types';
import { SkeletonCard } from './skeleton-card';

interface Props {
  data: TopSellerItem[];
  loading: boolean;
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

const FLAG_COLORS = ['#DC2626', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'];

export function TopSellersCard({ data, loading }: Props) {
  if (loading) return <SkeletonCard rows={5} />;

  const total = data.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="glass p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-sm">🏆</span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">Top Vendedores</span>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-1">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto] text-xs text-[var(--text-muted)] font-medium pb-2 border-b border-[var(--border)]">
          <span>Vendedor</span>
          <span className="text-right pr-4">Porcentaje</span>
          <span className="text-right">Total vendido</span>
        </div>

        {data.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-6">Sin datos de vendedores</p>
        ) : (
          data.map((seller, i) => (
            <div
              key={seller.sellerId}
              className="grid grid-cols-[1fr_auto_auto] items-center py-2.5 border-b border-[var(--border)] last:border-0"
            >
              {/* Name + flag */}
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-5 rounded-sm flex-shrink-0"
                  style={{ background: FLAG_COLORS[i % FLAG_COLORS.length] }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[140px]">
                    {seller.name}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">Doc: {seller.sellerId}</span>
                </div>
              </div>

              {/* Percentage with mini-bar */}
              <div className="flex flex-col items-end gap-1 pr-4 min-w-[80px]">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {seller.percentage.toFixed(2)}%
                </span>
                <div className="h-1 w-16 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${seller.percentage}%`,
                      background: FLAG_COLORS[i % FLAG_COLORS.length],
                    }}
                  />
                </div>
              </div>

              {/* Amount */}
              <span className="text-sm font-semibold text-[var(--text-primary)] text-right whitespace-nowrap">
                {formatCOP(seller.totalAmount)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Total */}
      {data.length > 0 && (
        <div className="flex items-center justify-between pt-1 text-xs text-[var(--text-muted)] border-t border-[var(--border)]">
          <span>Total acumulado año</span>
          <span className="font-bold text-[var(--text-primary)] text-sm">{formatCOP(total)}</span>
        </div>
      )}
    </div>
  );
}
