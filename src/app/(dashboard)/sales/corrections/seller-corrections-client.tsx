'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { getSales } from '@/lib/api/sales.api';
import { createSaleCorrectionRequest, listMySaleCorrectionRequests } from '@/lib/api/sale-correction-requests.api';
import { ApiError } from '@/lib/api/api-client';
import type { SaleCorrectionRequestDto, SaleCorrectionRequestStatus } from '@/types/sale-correction-request.types';
import { Button } from '@/components/ui/button';
import type { SaleDto, SaleDetailDto } from '@/types/sale.types';
import {
  saleHasBeverageDetails,
  saleHasBilliardDetails,
  filterBeverageDetails,
  filterBilliardDetails,
} from '@/types/sale.types';
import { TableSkeleton } from '../../_components/table-skeleton';
import {
  todayColombia,
  formatDayColombia,
  formatDateTimeColombia,
  isSaleOnColombiaCalendarDay,
} from '@/lib/date-colombia';
import { subscribeSaleCorrectionsRealtime } from '@/lib/realtime/sale-corrections-socket';

/** Alinea sale.id (venta) con request.saleId (API / ObjectId). */
function canonicalSaleId(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object' && value !== null && '$oid' in value) {
    const oid = (value as { $oid?: unknown }).$oid;
    if (typeof oid === 'string') return oid.trim();
  }
  return String(value).trim();
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function formatTableLabel(tableNumber: number | undefined | null): string {
  if (tableNumber === 0) return 'Bar / directo';
  if (tableNumber == null) return '—';
  return `Mesa ${tableNumber}`;
}

const TABLE_COLS = 6;

function correctionStatusLabel(status: SaleCorrectionRequestStatus): { text: string; className: string } {
  switch (status) {
    case 'PENDING':
      return {
        text: 'Solicitud pendiente',
        className: 'text-amber-800 dark:text-amber-200',
      };
    case 'RESOLVED':
      return { text: 'Atendida', className: 'text-emerald-700 dark:text-emerald-300' };
    case 'REJECTED':
      return { text: 'Rechazada', className: 'text-red-700 dark:text-red-300' };
    default:
      return { text: status, className: 'text-[var(--text-muted)]' };
  }
}

function CorrectionActionCell({
  saleId,
  requestBySaleId,
  onSolicitar,
}: {
  saleId: string;
  requestBySaleId: Map<string, SaleCorrectionRequestDto>;
  onSolicitar: () => void;
}) {
  const existing = requestBySaleId.get(canonicalSaleId(saleId));
  if (existing) {
    const { text, className } = correctionStatusLabel(existing.status);
    return (
      <span
        className={`inline-block text-sm font-medium tabular-nums ${className}`}
        title={existing.status === 'PENDING' ? 'Ya enviaste una solicitud para esta venta.' : undefined}
      >
        {text}
      </span>
    );
  }
  return (
    <Button type="button" variant="outline" size="sm" className="whitespace-nowrap" onClick={onSolicitar}>
      Solicitar
    </Button>
  );
}

export function SellerCorrectionsPageClient() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [sales, setSales] = useState<SaleDto[]>([]);
  const [myCorrectionRequests, setMyCorrectionRequests] = useState<SaleCorrectionRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [correctionSaleId, setCorrectionSaleId] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);

  const today = todayColombia();

  const loadTodaySales = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const [res, mine] = await Promise.all([
        getSales(today),
        listMySaleCorrectionRequests().catch(() => [] as SaleCorrectionRequestDto[]),
      ]);
      setMyCorrectionRequests(mine);
      const list = res.sales ?? [];
      setSales(list.filter((s) => isSaleOnColombiaCalendarDay(s.DateSale, today)));
    } catch {
      if (!silent) setSales([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [today]);

  /** Última solicitud por venta (más reciente si hubiera varias). */
  const requestBySaleId = useMemo(() => {
    const map = new Map<string, SaleCorrectionRequestDto>();
    const sorted = [...myCorrectionRequests].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    );
    for (const r of sorted) {
      const sid = canonicalSaleId(r.saleId);
      if (!sid) continue;
      if (!map.has(sid)) map.set(sid, r);
    }
    return map;
  }, [myCorrectionRequests]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (user.role === 'ADMIN') {
      router.replace('/sale-corrections');
      return;
    }
    if (user.role !== 'SELLER') {
      router.replace('/sales');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'SELLER') return;
    void loadTodaySales();
  }, [authLoading, user, loadTodaySales]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'SELLER') return;
    const socket = subscribeSaleCorrectionsRealtime(() => {
      void loadTodaySales({ silent: true });
    });
    return () => {
      socket?.disconnect();
    };
  }, [authLoading, user, loadTodaySales]);

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

  const submitCorrectionRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!correctionSaleId) return;
    setCorrectionSubmitting(true);
    try {
      const created = await createSaleCorrectionRequest({
        saleId: correctionSaleId,
        reason: correctionReason.trim() || undefined,
      });
      setMyCorrectionRequests((prev) => [created, ...prev]);
      toast.success('Solicitud enviada al administrador.');
      setCorrectionSaleId(null);
      setCorrectionReason('');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo enviar la solicitud.';
      toast.error(msg);
    } finally {
      setCorrectionSubmitting(false);
    }
  };

  if (authLoading || !user || user.role !== 'SELLER') {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--brand-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 animate-fadeIn">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Solicitar corrección</h1>
        <p className="mt-0.5 break-words text-sm text-[var(--text-muted)]">
          Solo puedes solicitar corrección sobre ventas registradas <strong>hoy</strong> (zona Colombia). Fecha:{' '}
          <span className="font-medium text-[var(--text-primary)]">{formatDayColombia(today)}</span>.
        </p>
      </div>

      <section className="glass overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ventas de bebidas (hoy)</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={TABLE_COLS} />
          ) : beverageSales.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-primary)]">
              No hay ventas de bebidas para hoy.
            </div>
          ) : (
            <table className="table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Fecha y hora</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Mesa / bar</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Vendedor</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Detalle</th>
                  <th className="px-5 py-3 text-right font-semibold text-[var(--text-primary)]">Total</th>
                  <th className="px-5 py-3 text-right font-semibold text-[var(--text-primary)] w-[8.5rem]">
                    Corrección
                  </th>
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
                      <td className="px-5 py-3 text-right">
                        <CorrectionActionCell
                          saleId={canonicalSaleId(sale.id)}
                          requestBySaleId={requestBySaleId}
                          onSolicitar={() => {
                            setCorrectionSaleId(sale.id);
                            setCorrectionReason('');
                          }}
                        />
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
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ventas del billar (hoy)</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={TABLE_COLS} />
          ) : billiardSales.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-primary)]">
              No hay ventas del billar para hoy.
            </div>
          ) : (
            <table className="table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Fecha y hora</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Mesa / bar</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Vendedor</th>
                  <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Detalle</th>
                  <th className="px-5 py-3 text-right font-semibold text-[var(--text-primary)]">Total</th>
                  <th className="px-5 py-3 text-right font-semibold text-[var(--text-primary)] w-[8.5rem]">
                    Corrección
                  </th>
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
                      <td className="px-5 py-3 text-right">
                        <CorrectionActionCell
                          saleId={canonicalSaleId(sale.id)}
                          requestBySaleId={requestBySaleId}
                          onSolicitar={() => {
                            setCorrectionSaleId(sale.id);
                            setCorrectionReason('');
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {correctionSaleId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-overlay)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="correction-dialog-title"
        >
          <form
            onSubmit={submitCorrectionRequest}
            className="glass w-full max-w-md rounded-xl border border-[var(--border)] p-6 shadow-lg"
          >
            <h2 id="correction-dialog-title" className="text-lg font-semibold text-[var(--text-primary)]">
              Solicitar corrección de venta
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Solo aplica a ventas de hoy. El administrador revisará la solicitud. Motivo opcional.
            </p>
            <label className="mt-4 block text-sm font-medium text-[var(--text-secondary)]" htmlFor="correction-reason">
              Motivo (opcional)
            </label>
            <textarea
              id="correction-reason"
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ej. Cantidad incorrecta, mesa equivocada…"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={correctionSubmitting}
                onClick={() => {
                  setCorrectionSaleId(null);
                  setCorrectionReason('');
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={correctionSubmitting}>
                {correctionSubmitting ? 'Enviando…' : 'Enviar solicitud'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
