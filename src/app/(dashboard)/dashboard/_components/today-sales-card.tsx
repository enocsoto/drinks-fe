'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TodaySalesResponse, BreakdownItem } from '@/types/analytics.types';
import { SkeletonCard } from './skeleton-card';

const COLORS = ['#DC2626', '#1E293B', '#94A3B8', '#F59E0B', '#10B981'];

const DRINK_ICONS: Record<string, string> = {
  ALCOHOLICA: '🍺',
  GASEOSA: '🥤',
  AGUA: '💧',
  JUGO: '🍊',
  OTRO: '🧃',
};

interface Props {
  data: TodaySalesResponse | null;
  loading: boolean;
}

function buildChartData(breakdown: BreakdownItem[]): { name: string; value: number }[] {
  if (!breakdown?.length) return [];
  const withSales = breakdown.filter((b) => (b.count ?? 0) > 0);
  if (withSales.length === 0) return [];
  return withSales.map((b) => ({ name: b.label, value: b.count }));
}

export function TodaySalesCard({ data, loading }: Props) {
  if (loading) return <SkeletonCard rows={4} />;

  const chartData = buildChartData(data?.breakdown ?? []);
  const topThree = [...(data?.breakdown ?? [])].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 3);

  return (
    <div className="glass p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white text-[10px] font-bold">
          ↑
        </span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">Incremento de Hoy</span>
      </div>

      {/* Donut + Total (o estado vacío si no hay ventas) */}
      <div className="flex items-center justify-center relative h-44">
        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                  }}
                  formatter={(value: number | undefined) => [(value ?? 0).toLocaleString('es-CO') + ' uds', 'Unidades']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-[var(--text-primary)]">{data?.totalSales ?? 0}</span>
              <span className="text-xs text-[var(--text-muted)] mt-0.5">Total Ventas</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-center">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center">
              <span className="text-2xl text-[var(--text-muted)]">0</span>
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{data?.totalSales ?? 0}</span>
            <span className="text-xs text-[var(--text-muted)]">Total Ventas · Sin ventas hoy</span>
          </div>
        )}
      </div>

      {/* Breakdown list */}
      <div className="flex flex-col gap-2">
        {topThree.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center">Sin ventas hoy</p>
        ) : (
          topThree.map((item, i) => (
            <div key={item.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{DRINK_ICONS[item.type] ?? '🧃'}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[var(--text-primary)]">{item.label}</span>
                  <div className="h-0.5 w-8 rounded-full mt-1" style={{ background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{item.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
