'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { AdminGuard } from '../_components/admin-guard';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '../_components/table-skeleton';
import {
  listSaleCorrectionRequests,
  updateSaleCorrectionRequest,
} from '@/lib/api/sale-correction-requests.api';
import { ApiError } from '@/lib/api/api-client';
import type { SaleCorrectionRequestDto } from '@/types/sale-correction-request.types';
import { cn } from '@/lib/utils';
import { subscribeSaleCorrectionsRealtime } from '@/lib/realtime/sale-corrections-socket';
import { AdminSaleEditDialog } from './_components/admin-sale-edit-dialog';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  RESOLVED: 'Resuelta',
  REJECTED: 'Rechazada',
};

export default function SaleCorrectionsPage() {
  const [items, setItems] = useState<SaleCorrectionRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingCorrection, setEditingCorrection] = useState<SaleCorrectionRequestDto | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const data = await listSaleCorrectionRequests();
      setItems(data);
    } catch {
      if (!silent) {
        setItems([]);
        toast.error('No se pudieron cargar las solicitudes.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const socket = subscribeSaleCorrectionsRealtime(() => {
      void load({ silent: true });
    });
    return () => {
      socket?.disconnect();
    };
  }, [load]);

  const resolve = async (id: string, status: 'RESOLVED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      await updateSaleCorrectionRequest(id, status);
      toast.success(status === 'RESOLVED' ? 'Marcada como resuelta.' : 'Solicitud cancelada.');
      await load({ silent: true });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Error al actualizar.';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const pending = items.filter((i) => i.status === 'PENDING');

  function formatCorrectionCell(row: SaleCorrectionRequestDto) {
    if (row.status === 'PENDING' || !row.resolvedAt) {
      return <span className="text-[var(--text-muted)]">—</span>;
    }
    return (
      <span className="text-[var(--text-secondary)] whitespace-nowrap tabular-nums text-sm">
        {new Date(row.resolvedAt).toLocaleString('es-CO')}
      </span>
    );
  }

  return (
    <AdminGuard>
      <div className="min-w-0 space-y-6 animate-fadeIn">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Correcciones de ventas</h1>
          <p className="mt-0.5 break-words text-sm text-[var(--text-muted)]">
            El mesero solicita revisión de una venta y la tabla se <strong className="font-medium text-[var(--text-secondary)]">actualiza en tiempo real</strong>{' '}
            al crear o cerrar solicitudes.
          </p>
        </div>

        <div className="glass overflow-hidden rounded-xl border border-[var(--border)]">
          <div className="border-b border-[var(--border)] px-5 py-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Solicitudes</h2>
            <span className="text-sm text-[var(--text-muted)]">
              {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
            </span>
          </div>
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No hay solicitudes registradas.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-zebra w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Estado</th>
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Doc. mesero</th>
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Mesero</th>
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Motivo</th>
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Fecha solicitud</th>
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)] min-w-[140px]">
                      Fecha corrección
                    </th>
                    <th className="px-5 py-3 text-right font-semibold text-[var(--text-primary)] w-[1%] whitespace-nowrap">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface)]/50">
                      <td className="px-5 py-3 text-[var(--text-secondary)]">{STATUS_LABEL[row.status] ?? row.status}</td>
                      <td
                        className="px-5 py-3 tabular-nums text-[var(--text-secondary)]"
                        title={`Venta (id): ${row.saleId}`}
                      >
                        {row.requestedByDocument != null ? row.requestedByDocument : '—'}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">
                        {row.requestedByName?.trim() ? row.requestedByName.trim() : '—'}
                      </td>
                      <td className="px-5 py-3 max-w-[240px] truncate text-[var(--text-secondary)]" title={row.reason}>
                        {row.reason?.trim() ? row.reason : '—'}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)] whitespace-nowrap">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString('es-CO') : '—'}
                      </td>
                      <td className="px-5 py-3 align-top text-[var(--text-secondary)]">{formatCorrectionCell(row)}</td>
                      <td className="px-5 py-3 text-right align-middle whitespace-nowrap">
                        <div className="inline-flex flex-row flex-nowrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className={cn('h-9 w-9 shrink-0 p-0')}
                            title="Editar venta"
                            aria-label="Editar venta"
                            disabled={updatingId === row.id}
                            onClick={() => setEditingCorrection(row)}
                          >
                            <svg
                              className="h-4 w-4 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Button>
                          {row.status === 'PENDING' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className={cn('h-9 w-9 shrink-0 p-0')}
                              title="Cancelar solicitud"
                              aria-label="Cancelar solicitud de corrección"
                              disabled={updatingId === row.id}
                              onClick={() => resolve(row.id, 'REJECTED')}
                            >
                              <svg
                                className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                aria-hidden
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          También puedes revisar el día en{' '}
          <Link href="/sales" className="font-medium text-[var(--brand-primary)] underline">
            Ventas
          </Link>
          .
        </p>

        <AdminSaleEditDialog
          open={editingCorrection != null}
          onOpenChange={(o) => {
            if (!o) setEditingCorrection(null);
          }}
          correction={editingCorrection}
          onSaved={() => void load({ silent: true })}
        />
      </div>
    </AdminGuard>
  );
}
