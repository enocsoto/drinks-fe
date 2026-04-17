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

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  RESOLVED: 'Resuelta',
  REJECTED: 'Rechazada',
};

export default function SaleCorrectionsPage() {
  const [items, setItems] = useState<SaleCorrectionRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSaleCorrectionRequests();
      setItems(data);
    } catch {
      setItems([]);
      toast.error('No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (id: string, status: 'RESOLVED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      await updateSaleCorrectionRequest(id, status);
      toast.success(status === 'RESOLVED' ? 'Marcada como resuelta.' : 'Solicitud rechazada.');
      await load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Error al actualizar.';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const pending = items.filter((i) => i.status === 'PENDING');

  return (
    <AdminGuard>
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Correcciones de ventas</h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            El mesero solicita revisión de una venta; cuando aplicques los ajustes en la venta (desde administración /
            sistema), marca la solicitud como resuelta.
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
            <TableSkeleton rows={5} cols={6} />
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No hay solicitudes registradas.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Estado</th>
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Venta</th>
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Doc. mesero</th>
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Motivo</th>
                    <th className="px-5 py-3 text-left font-semibold text-[var(--text-primary)]">Fecha</th>
                    <th className="px-5 py-3 text-right font-semibold text-[var(--text-primary)]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface)]/50">
                      <td className="px-5 py-3 text-[var(--text-secondary)]">{STATUS_LABEL[row.status] ?? row.status}</td>
                      <td className="px-5 py-3 font-mono text-xs text-[var(--text-primary)]">{row.saleId}</td>
                      <td className="px-5 py-3 tabular-nums text-[var(--text-secondary)]">{row.requestedByDocument}</td>
                      <td className="px-5 py-3 max-w-[240px] truncate text-[var(--text-secondary)]" title={row.reason}>
                        {row.reason?.trim() ? row.reason : '—'}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)] whitespace-nowrap">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString('es-CO') : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {row.status === 'PENDING' ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={updatingId === row.id}
                              onClick={() => resolve(row.id, 'RESOLVED')}
                            >
                              Resuelta
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={updatingId === row.id}
                              onClick={() => resolve(row.id, 'REJECTED')}
                            >
                              Rechazar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            {row.resolvedAt ? new Date(row.resolvedAt).toLocaleString('es-CO') : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Tip: la lista de ventas del día está en{' '}
          <Link href="/sales" className="font-medium text-[var(--brand-primary)] underline">
            Ventas
          </Link>{' '}
          para localizar y corregir la venta antes de marcar la solicitud.
        </p>
      </div>
    </AdminGuard>
  );
}
