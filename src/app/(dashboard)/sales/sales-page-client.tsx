'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSales } from '@/lib/api/sales.api';
import type { SaleDto, SaleDetailDto } from '@/types/sale.types';
import {
  saleHasBeverageDetails,
  saleHasBilliardDetails,
  filterBeverageDetails,
  filterBilliardDetails,
} from '@/types/sale.types';
import { TableSkeleton } from '../_components/table-skeleton';
import { todayColombia, formatDayColombia, formatDateTimeColombia } from '@/lib/date-colombia';
import { SalesRegisterForm } from './_components/sales-register-form';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function formatTableLabel(tableNumber: number | undefined | null): string {
  if (tableNumber === 0) return 'Bar / directo';
  if (tableNumber == null) return '—';
  return `Mesa ${tableNumber}`;
}

export function SalesPageClient() {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleDto[]>([]);
  const [summary, setSummary] = useState<Array<{ sellerId: number; name?: string; totalQuantity: number }>>([]);
  const [loading, setLoading] = useState(true);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSales(todayColombia());
      setSales(res.sales ?? []);
      setSummary(res.summary ?? []);
    } catch {
      setSales([]);
      setSummary([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const beverageSales = sales.filter(saleHasBeverageDetails);
  const billiardSales = sales.filter(saleHasBilliardDetails);

  const detailLabel = (d: SaleDetailDto) => {
    if (!d) return '';
    if (d.type === 'BEVERAGE' && d.beverage) {
      return `${d.quantity} × ${d.beverage.name ?? 'Bebida'} (${formatMoney(Number(d.unitPrice))})`;
    }
    if (d.type === 'GLOVES') return `${d.quantity} × Guantes (${formatMoney(Number(d.unitPrice))})`;
    if (d.type === 'GAME') return `${d.quantity} × Juego (${formatMoney(Number(d.unitPrice))})`;
    return `${d.quantity} × ${formatMoney(Number(d.unitPrice))}`;
  };

  const tableCols = 5;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Ventas</h1>
          <p className="mt-0.5 text-sm text-[var(--text-primary)]">
            Bebidas por mesa y ventas del billar (guantes, juegos). Sesión:{' '}
            <span className="font-medium text-[var(--text-primary)]">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">Fecha</span>
          <span
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium tabular-nums text-[var(--text-primary)]"
            aria-label={`Ventas del día ${formatDayColombia(todayColombia())}`}
          >
            {formatDayColombia(todayColombia())}
          </span>
        </div>
      </div>

      <SalesRegisterForm onRegistered={loadSales} />

      {summary.length > 0 && (
        <section className="glass rounded-xl border border-[var(--border)] p-5">
          <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Resumen por vendedor</h2>
          <div className="flex flex-wrap gap-3">
            {summary.map((s) => (
              <div
                key={s.sellerId}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2"
              >
                <span className="font-medium text-[var(--text-primary)]">{s.name ?? s.sellerId}</span>
                <span className="text-sm text-[var(--text-primary)]">{s.totalQuantity} unidades</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ventas de bebidas</h2>
          <p className="mt-0.5 text-sm text-[var(--text-primary)]">
            Cervezas, gaseosas, aguardiente, etc. asociadas a mesa de billar o bar.
          </p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={tableCols} />
          ) : beverageSales.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-primary)]">
              No hay ventas de bebidas para esta fecha.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Fecha y hora</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Mesa / bar</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Vendedor</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Detalle</th>
                  <th className="px-5 py-3 text-right font-semibold text-[var(--text-primary)]">Total</th>
                </tr>
              </thead>
              <tbody>
                {beverageSales.map((sale) => {
                  const beverageDetails = filterBeverageDetails(sale.details);
                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--bg-surface)]/50"
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-[var(--text-primary)]">
                        {formatDateTimeColombia(sale.DateSale)}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">{formatTableLabel(sale.tableNumber)}</td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">
                        {sale.user?.name ?? sale.userDocument}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">
                        {beverageDetails.map((d, i) => (
                          <span key={i}>{detailLabel(d)}</span>
                        ))}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-[var(--text-primary)]">
                        {formatMoney(Number(sale.totalPrice))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="glass overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ventas del billar</h2>
          <p className="mt-0.5 text-sm text-[var(--text-primary)]">
            Guantes, juegos (chicos, buchacara) y otros conceptos.
          </p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={tableCols} />
          ) : billiardSales.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-primary)]">
              No hay ventas del billar para esta fecha.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Fecha y hora</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Mesa / bar</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Vendedor</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Detalle</th>
                  <th className="px-5 py-3 text-right font-semibold text-[var(--text-primary)]">Total</th>
                </tr>
              </thead>
              <tbody>
                {billiardSales.map((sale) => {
                  const billiardDetails = filterBilliardDetails(sale.details);
                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--bg-surface)]/50"
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-[var(--text-primary)]">
                        {formatDateTimeColombia(sale.DateSale)}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">{formatTableLabel(sale.tableNumber)}</td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">
                        {sale.user?.name ?? sale.userDocument}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">
                        {billiardDetails.map((d, i) => (
                          <span key={i}>{detailLabel(d)}</span>
                        ))}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-[var(--text-primary)]">
                        {formatMoney(Number(sale.totalPrice))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
