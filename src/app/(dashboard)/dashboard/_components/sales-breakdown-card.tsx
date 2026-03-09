'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SalesByBeverageResponse, BeverageBreakdownItem } from '@/types/analytics.types';
import { SkeletonCard } from './skeleton-card';

interface Props {
  dataMonth: SalesByBeverageResponse | null;
  dataWeek?: SalesByBeverageResponse | null;
  dataDay?: SalesByBeverageResponse | null;
  loading: boolean;
}

const PERIOD_TABS = ['Diario', 'Semanal', 'Mensual', 'Anual'] as const;

/** Colores por índice para cada bebida (una raya por color) */
const BEVERAGE_COLORS = [
  '#DC2626', // rojo
  '#1E293B', // slate
  '#3B82F6', // azul
  '#F59E0B', // ámbar
  '#10B981', // esmeralda
  '#8B5CF6', // violeta
  '#EC4899', // rosa
  '#94A3B8', // gris
];

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', { notation: 'compact', compactDisplay: 'short' }).format(n);
}

function getBeverageColor(index: number): string {
  return BEVERAGE_COLORS[index % BEVERAGE_COLORS.length];
}

/** Une las series de todas las bebidas en un solo array por período (name) con un campo por beverageId */
function buildMergedChartData(breakdown: BeverageBreakdownItem[]): Record<string, string | number>[] {
  if (breakdown.length === 0) return [];

  const labels = breakdown[0].series.map((s) => s.label);
  const byLabel = new Map<string, Record<string, string | number>>();

  for (const label of labels) {
    const row: Record<string, string | number> = { name: label };
    for (const item of breakdown) {
      const point = item.series.find((s) => s.label === label);
      row[item.beverageId] = point?.count ?? 0;
    }
    byLabel.set(label, row);
  }

  return labels.map((label) => byLabel.get(label)!);
}

export function SalesBreakdownCard({ dataMonth, dataWeek, dataDay, loading }: Props) {
  const [activeTab, setActiveTab] = useState(2); // Mensual

  const isDiario = activeTab === 0;
  const isSemanal = activeTab === 1;
  const data = isDiario ? dataDay : isSemanal ? dataWeek : dataMonth;
  const breakdown: BeverageBreakdownItem[] = data?.breakdown ?? [];

  const chartData = useMemo(() => buildMergedChartData(data?.breakdown ?? []), [data]);
  const hasChartData = chartData.length > 0;
  const total = Math.max(0, Number(data?.totalTicketSales ?? 0));

  if (loading) return <SkeletonCard rows={6} />;

  return (
    <div className="glass p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Desglose de Ventas por Bebida</span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-surface)] rounded-lg p-1">
          {PERIOD_TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={[
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                activeTab === i
                  ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div>
        <p className="text-4xl font-bold text-[var(--text-primary)]">{total.toLocaleString('es-CO')}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2">
          Total unidades vendidas
          <span className="font-bold text-[var(--text-primary)]">{new Date().getFullYear()}</span>
        </p>
      </div>

      {/* Barras por bebida */}
      <div className="flex flex-col gap-3">
        {breakdown.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">Sin datos de ventas</p>
        ) : (
          breakdown.map((item: BeverageBreakdownItem, index: number) => (
            <div key={item.beverageId} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--text-secondary)]">{item.name}</span>
                <span className="text-[var(--text-muted)]">
                  {item.percentage}% · {item.count.toLocaleString('es-CO')} uds
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${item.percentage}%`,
                    background: getBeverageColor(index),
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Un solo gráfico con una raya por bebida */}
      <div className="h-56">
        {hasChartData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v === 0 ? '0' : formatCOP(v))}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                }}
                formatter={(v: number | undefined, name: string | undefined) => {
                  const key = name ?? '';
                  const beverage = breakdown.find((b) => b.beverageId === key);
                  return [Number(v ?? 0).toLocaleString('es-CO'), beverage?.name ?? key];
                }}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend
                formatter={(value) => {
                  const beverage = breakdown.find((b) => b.beverageId === value);
                  return beverage?.name ?? value;
                }}
                wrapperStyle={{ fontSize: 11 }}
                iconType="line"
                iconSize={8}
              />
              {breakdown.map((item: BeverageBreakdownItem, index: number) => (
                <Line
                  key={item.beverageId}
                  type="monotone"
                  dataKey={item.beverageId}
                  name={item.beverageId}
                  stroke={getBeverageColor(index)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: getBeverageColor(index) }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
            Sin datos para el gráfico
          </div>
        )}
      </div>

      {/* Leyenda por bebida */}
      {breakdown.length > 0 && (
        <div className="flex flex-wrap gap-4 pt-1 border-t border-[var(--border)]">
          {breakdown.map((item: BeverageBreakdownItem, index: number) => (
            <div key={item.beverageId} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: getBeverageColor(index) }} />
              <span className="text-xs text-[var(--text-secondary)]">
                {item.name} <span className="font-semibold text-[var(--text-primary)]">{item.percentage}%</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
