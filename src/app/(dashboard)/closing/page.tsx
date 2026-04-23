'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminGuard } from '../_components/admin-guard';
import { getDailyClosingData, downloadDailyClosingPdf } from '@/lib/api/reports.api';
import type { DailyClosingData } from '@/types/reports.types';
import { todayColombia } from '@/lib/date-colombia';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { TableSkeleton } from '../_components/table-skeleton';

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateDisplay(dateStr: string): string {
  try {
    const d = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
    return new Date(d).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ClosingPage() {
  const [date, setDate] = useState(() => todayColombia());
  const [data, setData] = useState<DailyClosingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDailyClosingData(date);
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Error al cargar el cierre del día');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    setError(null);
    try {
      await downloadDailyClosingPdf(date);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar el PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-w-0 space-y-6 animate-fadeIn">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Cierre del día</h1>
            <p className="mt-0.5 break-words text-sm text-[var(--text-muted)]">
              Cuadre de ventas y generación del documento de cierre (PDF)
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto">
            <label className="flex w-full min-w-0 flex-col gap-1.5 text-sm text-[var(--text-secondary)] sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              <span className="shrink-0">Fecha</span>
              <DateInput
                value={date}
                onValueChange={setDate}
                aria-label="Fecha de cierre"
                className="w-full min-w-0 bg-[var(--bg-surface)] sm:w-[min(100%,12rem)] sm:min-w-[10.5rem]"
              />
            </label>
            <Button
              type="button"
              onClick={handleGeneratePdf}
              disabled={pdfLoading}
              className="w-full min-h-10 shrink-0 bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-h)] sm:w-auto"
            >
              {pdfLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generando…
                </>
              ) : (
                <>Descargar PDF</>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div
            className="rounded-lg border border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Cuadre del día — {formatDateDisplay(date)}
            </h2>
            {data?.generatedAt && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Datos generados: {formatDateDisplay(data.generatedAt)}
              </p>
            )}
          </div>

          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={8} cols={4} />
            </div>
          ) : !data ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No se pudieron cargar los datos del cierre.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table-zebra w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                      <th className="text-left py-3 px-4 font-semibold text-[var(--text-primary)]">Producto</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--text-primary)]">Cantidad</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--text-primary)]">P. unit. (COP)</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--text-primary)]">Subtotal (COP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">
                          No hay ventas registradas para este día.
                        </td>
                      </tr>
                    ) : (
                      data.items.map((item, i) => (
                        <tr
                          key={`${item.beverageName}-${i}`}
                          className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)]/50"
                        >
                          <td className="py-2.5 px-4 text-[var(--text-primary)]">{item.beverageName}</td>
                          <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">{item.quantity}</td>
                          <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                            {formatCop(item.unitPrice)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium text-[var(--text-primary)]">
                            {formatCop(item.subtotal)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {data.items.length > 0 && (
                <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Total unidades vendidas</span>
                    <span className="font-medium text-[var(--text-primary)]">{data.totalQuantity}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Total transacciones (ventas)</span>
                    <span className="font-medium text-[var(--text-primary)]">{data.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[var(--text-primary)] pt-1 border-t border-[var(--border)]">
                    <span>Total monto (COP)</span>
                    <span>{formatCop(data.totalAmount)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </AdminGuard>
  );
}
