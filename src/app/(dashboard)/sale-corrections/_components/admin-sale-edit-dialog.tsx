'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatCOP } from '@/lib/utils';
import { getBeverages } from '@/lib/api/beverages.api';
import { getSaleByIdForAdmin, updateSale } from '@/lib/api/sales.api';
import { updateSaleCorrectionRequest } from '@/lib/api/sale-correction-requests.api';
import { ApiError } from '@/lib/api/api-client';
import type { BeverageDto } from '@/types/beverage.types';
import type { SaleCorrectionRequestDto } from '@/types/sale-correction-request.types';
import type { SaleDetailDto, SaleDto } from '@/types/sale.types';
import { SALE_DETAIL_TYPE_LABELS } from '@/types/sale.types';

const textareaClass = cn(
  'flex min-h-[72px] w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)]',
  'placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 disabled:opacity-50',
);

function formatTableLabel(tableNumber: number | undefined | null): string {
  if (tableNumber === 0) return 'Bar / directo';
  if (tableNumber == null) return '—';
  return `Mesa ${tableNumber}`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  correction: SaleCorrectionRequestDto | null;
  onSaved: () => void;
};

export function AdminSaleEditDialog({ open, onOpenChange, correction, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sale, setSale] = useState<SaleDto | null>(null);
  const [beverages, setBeverages] = useState<BeverageDto[]>([]);

  /** Texto libre en el input; vacío permitido mientras edita (placeholder 0); se valida al guardar. */
  const [quantityInput, setQuantityInput] = useState('');
  const [selectedBeverageId, setSelectedBeverageId] = useState('');
  const [unitPriceInput, setUnitPriceInput] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [markResolved, setMarkResolved] = useState(true);

  const resetLocal = useCallback(() => {
    setSale(null);
    setLoadError(null);
    setQuantityInput('');
    setSelectedBeverageId('');
    setUnitPriceInput('');
    setChangeDescription('');
    setMarkResolved(true);
  }, []);

  useEffect(() => {
    if (!open || !correction) {
      resetLocal();
      return;
    }

    setMarkResolved(correction.status === 'PENDING');

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [saleRes, bevRes] = await Promise.all([
          getSaleByIdForAdmin(correction.saleId),
          getBeverages({ limit: 500, includeInactive: true }),
        ]);
        if (cancelled) return;
        setSale(saleRes);
        setBeverages(bevRes.data);
        const d0 = saleRes.details?.[0];
        if (d0) {
          setQuantityInput(String(Math.max(1, Number(d0.quantity))));
          if (d0.type === 'BEVERAGE') {
            setSelectedBeverageId(d0.beverageId ?? '');
          }
          setUnitPriceInput(String(Math.max(0, Math.round(Number(d0.unitPrice)))));
        }
        const reason = correction.reason?.trim();
        setChangeDescription(reason ? `Corrección: ${reason}` : '');
      } catch (e) {
        const msg =
          e instanceof ApiError ? e.message : 'No se pudo cargar la venta. Verifica el id o tu sesión de administrador.';
        if (!cancelled) {
          setLoadError(msg);
          setSale(null);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, correction, resetLocal]);

  const rawDetails = sale?.details;
  const detailsList = Array.isArray(rawDetails) ? rawDetails : [];
  const detail: SaleDetailDto | undefined = detailsList[0];
  const multiLine = detailsList.length > 1;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!correction || !sale || !detail) return;

    const qtyParsed =
      quantityInput.trim() === '' ? Number.NaN : Number.parseInt(quantityInput.trim(), 10);
    if (!Number.isFinite(qtyParsed) || qtyParsed < 1) {
      toast.error('La cantidad debe ser un número entero mayor o igual a 1.');
      return;
    }

    const desc = changeDescription.trim() || 'Corrección administrativa';

    let unitPriceForApi = 0;
    if (detail.type === 'BEVERAGE') {
      if (!selectedBeverageId) {
        toast.error('Selecciona una bebida.');
        return;
      }
    } else {
      const priceParsed =
        unitPriceInput.trim() === '' ? Number.NaN : Number.parseInt(unitPriceInput.trim(), 10);
      if (!Number.isFinite(priceParsed) || priceParsed < 0) {
        toast.error('Indica un precio unitario válido en pesos (COP).');
        return;
      }
      unitPriceForApi = priceParsed;
    }

    setSaving(true);
    try {
      if (detail.type === 'BEVERAGE') {
        await updateSale(sale.id, {
          quantity: qtyParsed,
          beverageId: selectedBeverageId,
          changeDescription: desc,
        });
      } else {
        await updateSale(sale.id, {
          quantity: qtyParsed,
          unitPrice: unitPriceForApi,
          changeDescription: desc,
        });
      }

      const markRequestResolved = markResolved && correction.status === 'PENDING';
      if (markRequestResolved) {
        await updateSaleCorrectionRequest(correction.id, 'RESOLVED');
      }

      toast.success(
        markRequestResolved
          ? 'Venta actualizada y solicitud marcada como resuelta.'
          : 'Venta actualizada.',
      );
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo guardar el cambio.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !correction) {
    return null;
  }

  /** Montado en `document.body` para no quedar recortado por `overflow-hidden` del layout (h-screen / main). */
  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[var(--bg-overlay)] p-4 pt-6 pb-8 sm:p-6 sm:pt-8 sm:pb-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-sale-edit-title"
    >
      <div className="glass my-auto w-full max-w-3xl overflow-hidden rounded-xl border border-[var(--border)] shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 id="admin-sale-edit-title" className="text-lg font-semibold text-[var(--text-primary)]">
              Corregir venta
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)] font-mono break-all">Venta: {correction.saleId}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Cerrar
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">Cargando venta…</div>
        ) : loadError ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400 text-sm">{loadError}</div>
        ) : sale && !detail ? (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[var(--text-muted)]">Mesa</span>
                <p className="font-medium text-[var(--text-primary)]">{formatTableLabel(sale.tableNumber)}</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Vendedor (documento)</span>
                <p className="font-medium tabular-nums text-[var(--text-primary)]">{sale.userDocument}</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Total</span>
                <p className="font-medium text-[var(--text-primary)]">{formatCOP(Number(sale.totalPrice))}</p>
              </div>
              {sale.DateSale ? (
                <div>
                  <span className="text-[var(--text-muted)]">Fecha venta</span>
                  <p className="font-medium text-[var(--text-primary)] whitespace-nowrap">
                    {new Date(sale.DateSale).toLocaleString('es-CO')}
                  </p>
                </div>
              ) : null}
            </div>
            <div
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
              role="alert"
            >
              No hay líneas de detalle registradas para esta venta (o no se pudieron leer). Sin una línea de venta no se
              puede corregir cantidad o producto desde aquí. Si acabas de crear la venta, recarga; si el problema continúa,
              revisa la base de datos.
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : sale && detail ? (
          <form noValidate onSubmit={handleSubmit} className="p-5 space-y-4">
            {multiLine && (
              <div
                className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100"
                role="status"
              >
                Esta venta tiene varias líneas de detalle. El sistema solo permite editar la <strong>primera línea</strong>{' '}
                (misma regla que en el backend).
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[var(--text-muted)]">Mesa</span>
                <p className="font-medium text-[var(--text-primary)]">{formatTableLabel(sale.tableNumber)}</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Vendedor (documento)</span>
                <p className="font-medium tabular-nums text-[var(--text-primary)]">{sale.userDocument}</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Total actual</span>
                <p className="font-medium text-[var(--text-primary)]">{formatCOP(Number(sale.totalPrice))}</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Tipo de línea</span>
                <p className="font-medium text-[var(--text-primary)]">
                  {SALE_DETAIL_TYPE_LABELS[detail.type] ?? detail.type}
                </p>
              </div>
            </div>

            {detail.type === 'BEVERAGE' ? (
              <>
                <div>
                  <label htmlFor="admin-edit-qty" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Cantidad *
                  </label>
                  <Input
                    id="admin-edit-qty"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={quantityInput}
                    onChange={(ev) => {
                      const v = ev.target.value;
                      if (v === '') {
                        setQuantityInput('');
                        return;
                      }
                      if (/^\d+$/.test(v)) setQuantityInput(v);
                    }}
                    placeholder="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="admin-edit-bev" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Bebida vendida *
                  </label>
                  <select
                    id="admin-edit-bev"
                    required
                    value={selectedBeverageId}
                    onChange={(ev) => setSelectedBeverageId(ev.target.value)}
                    className={cn(
                      'h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                    )}
                  >
                    <option value="" disabled>
                      Seleccionar…
                    </option>
                    {selectedBeverageId && !beverages.some((b) => b.id === selectedBeverageId) && (
                      <option value={selectedBeverageId}>
                        {detail.beverage?.name ?? 'Bebida de la venta'} — actual (no listada en catálogo)
                      </option>
                    )}
                    {beverages.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} — {formatCOP(b.price)}
                        {!b.isActive ? ' (inactiva)' : ''}
                      </option>
                    ))}
                  </select>
                  {detail.beverage && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Registrado: {detail.beverage.name ?? '—'} ({formatCOP(Number(detail.beverage.price ?? detail.unitPrice))})
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="admin-edit-qty-b" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Cantidad *
                  </label>
                  <Input
                    id="admin-edit-qty-b"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={quantityInput}
                    onChange={(ev) => {
                      const v = ev.target.value;
                      if (v === '') {
                        setQuantityInput('');
                        return;
                      }
                      if (/^\d+$/.test(v)) setQuantityInput(v);
                    }}
                    placeholder="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="admin-edit-price" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Precio unitario (COP) *
                  </label>
                  <Input
                    id="admin-edit-price"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={unitPriceInput}
                    onChange={(ev) => {
                      const v = ev.target.value;
                      if (v === '') {
                        setUnitPriceInput('');
                        return;
                      }
                      if (/^\d+$/.test(v)) setUnitPriceInput(v);
                    }}
                    placeholder="0"
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    En guantes y juegos el precio lo define la caja; ajústalo si hubo error.
                  </p>
                </div>
              </>
            )}

            <div>
              <label htmlFor="admin-edit-desc" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Motivo del cambio (auditoría)
              </label>
              <textarea
                id="admin-edit-desc"
                className={textareaClass}
                rows={3}
                value={changeDescription}
                onChange={(ev) => setChangeDescription(ev.target.value)}
                placeholder="Ej. Se ajustó la cantidad: solo salieron 3 cervezas."
              />
            </div>

            {correction.status === 'PENDING' && (
              <label className="flex items-start gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-[var(--border)]"
                  checked={markResolved}
                  onChange={(ev) => setMarkResolved(ev.target.checked)}
                />
                <span>Marcar la solicitud del mesero como resuelta al guardar</span>
              </label>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            No se pudo obtener la venta. Cierra e inténtalo de nuevo.
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(overlay, document.body);
}
