'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SalesByPeriodResponse } from '@/types/analytics.types';
import { SkeletonCard } from './skeleton-card';

interface Props {
  data: SalesByPeriodResponse | null;
  loading: boolean;
}

export function MonthlyRetentionCard({ data, loading }: Props) {
  if (loading) return <SkeletonCard rows={5} />;

  const series = data?.series ?? [];
  const breakdown = data?.breakdown ?? [];

  const totalYear = data?.totalTicketSales ?? 0;
  const totalAmount = data?.totalAmount ?? 0;

  // Datos para el gráfico: todos los meses del año (series ya viene ordenada Ene–Dic)
  const displayData =
    series.length > 0
      ? series.map((s) => ({
          name: s.label,
          ventas: s.count,
          monto: Math.round(s.amount),
        }))
      : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((name) => ({
          name,
          ventas: 0,
          monto: 0,
        }));

  const hasData = totalYear > 0;
  const topType = breakdown.length > 0 ? [...breakdown].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))[0] : null;

  return (
    <div className="glass p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">📈</span>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Ventas Mensuales</p>
            <p className="text-[10px] text-[var(--text-muted)]">Año {new Date().getFullYear()} · actualizado hace 1h</p>
          </div>
        </div>
      </div>

      {/* Stat central */}
      <div className="flex items-start gap-6">
        <div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            {hasData && topType ? `${Math.round(topType.percentage ?? 0)}%` : '—'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {hasData && topType ? `${topType.label} es el tipo más vendido` : 'Sin ventas registradas'}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            <span>
              <span className="font-semibold text-[var(--text-primary)]">{totalYear.toLocaleString('es-CO')}</span> uds
            </span>
            <span className="w-px h-3 bg-[var(--border)]" />
            <span>
              <span className="font-semibold text-[var(--text-primary)]">
                {new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(totalAmount)}
              </span>{' '}
              COP
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart: dos ejes Y para que unidades y monto se vean bien */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData} margin={{ top: 5, right: 50, left: 0, bottom: 0 }} barSize={20} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="ventas"
              orientation="left"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (Number(v) >= 1000 ? `${Number(v) / 1000}k` : String(v))}
            />
            <YAxis
              yAxisId="monto"
              orientation="right"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : String(v))}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)',
                fontSize: 12,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any, name: any) => [
                name === 'ventas'
                  ? Number(v ?? 0).toLocaleString('es-CO') + ' uds'
                  : new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0,
                    }).format(Number(v ?? 0)),
                name === 'ventas' ? 'Unidades' : 'Monto',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }}
              formatter={(value) => (value === 'ventas' ? 'Unidades' : 'Monto COP')}
            />
            <Bar dataKey="ventas" yAxisId="ventas" fill="#DC2626" radius={[3, 3, 0, 0]} name="ventas" />
            <Bar dataKey="monto" yAxisId="monto" fill="#1E293B" radius={[3, 3, 0, 0]} name="monto" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda colores */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#DC2626]" />
          <span>Unidades</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#1E293B]" />
          <span>Monto COP</span>
        </div>
      </div>
    </div>
  );
}
