'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSale } from '@/lib/api/sales.api';
import { getBeverages } from '@/lib/api/beverages.api';
import type { CreateSaleDto, SaleDetailType } from '@/types/sale.types';
import { SALE_DETAIL_TYPE_LABELS } from '@/types/sale.types';
import type { BeverageDto } from '@/types/beverage.types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SalesRegisterBeveragePanel } from './sales-register-beverage-panel';

const TABLES = [1, 2, 3, 4, 5, 6] as const;
const BEVERAGE_PAGE_SIZE = 10;

const SALE_TABS: { id: SaleDetailType; label: string; short: string }[] = [
  { id: 'BEVERAGE', label: SALE_DETAIL_TYPE_LABELS.BEVERAGE, short: 'Bebidas' },
  { id: 'GLOVES', label: SALE_DETAIL_TYPE_LABELS.GLOVES, short: 'Guantes' },
  { id: 'GAME', label: SALE_DETAIL_TYPE_LABELS.GAME, short: 'Juego' },
];

type CartItem = { beverage: BeverageDto; quantity: number };

function stockAvailable(b: Pick<BeverageDto, 'stock'>): number {
  return Math.max(0, Math.floor(Number(b.stock ?? 0)));
}

interface Props {
  onRegistered: () => void;
}

export function SalesRegisterForm({ onRegistered }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateSaleDto>({
    tableNumber: 1,
    lineType: 'BEVERAGE',
    beverageId: '',
    quantity: 1,
    unitPrice: 0,
    description: '',
  });
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [beverages, setBeverages] = useState<BeverageDto[]>([]);
  const [beveragesError, setBeveragesError] = useState<string | null>(null);
  const [beveragesLoading, setBeveragesLoading] = useState(true);
  const [beverageSearch, setBeverageSearch] = useState('');
  const [beverageSearchDebounced, setBeverageSearchDebounced] = useState('');
  const [beveragePage, setBeveragePage] = useState(1);
  const [beverageTotalPages, setBeverageTotalPages] = useState(1);
  const [beverageTotal, setBeverageTotal] = useState(0);
  /** true = mesa 1–6; false = venta directa / bar (API envía 0) */
  const [assignToTable, setAssignToTable] = useState(true);
  const [mesaNumber, setMesaNumber] = useState(1);

  const tableNumberForSubmit = assignToTable ? mesaNumber : 0;

  const loadBeverages = useCallback(async (page: number, search: string) => {
    setBeveragesError(null);
    setBeveragesLoading(true);
    try {
      const res = await getBeverages({
        page,
        limit: BEVERAGE_PAGE_SIZE,
        search: search.trim() || undefined,
      });
      setBeverages(res.data ?? []);
      setBeverageTotalPages(res.totalPages ?? 1);
      setBeverageTotal(res.total ?? 0);
    } catch (err) {
      setBeverages([]);
      setBeverageTotalPages(1);
      setBeverageTotal(0);
      const msg = err instanceof Error ? err.message : String(err);
      setBeveragesError(
        msg ||
          'No se pudieron cargar las bebidas. Revisa que el backend esté en marcha y el seed ejecutado.',
      );
    } finally {
      setBeveragesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (form.lineType !== 'BEVERAGE') return;
    loadBeverages(beveragePage, beverageSearchDebounced);
  }, [beveragePage, beverageSearchDebounced, loadBeverages, form.lineType]);

  useEffect(() => {
    const t = setTimeout(() => {
      setBeverageSearchDebounced(beverageSearch);
      setBeveragePage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [beverageSearch]);

  const addToCart = (beverage: BeverageDto) => {
    const max = stockAvailable(beverage);
    if (max <= 0) return;
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(beverage.id);
      if (existing) {
        if (existing.quantity >= max) return prev;
        next.set(beverage.id, {
          ...existing,
          quantity: Math.min(existing.quantity + 1, max),
          beverage,
        });
      } else {
        next.set(beverage.id, { beverage, quantity: 1 });
      }
      return next;
    });
  };

  const updateCartQuantity = (beverageId: string, delta: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const item = next.get(beverageId);
      if (!item) return prev;
      const max = stockAvailable(item.beverage);
      if (delta > 0 && max < item.quantity + delta) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        next.delete(beverageId);
      } else {
        next.set(beverageId, { ...item, quantity: newQty });
      }
      return next;
    });
  };

  const cartItems = Array.from(cart.values());
  const cartUnits = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.quantity * Number(i.beverage.price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.lineType === 'BEVERAGE') {
      if (cart.size === 0) {
        setError('Añade al menos una bebida al pedido.');
        return;
      }
      for (const [, item] of cart) {
        const max = stockAvailable(item.beverage);
        if (item.quantity > max) {
          setError(
            `La cantidad de «${item.beverage.name}» supera el inventario disponible (${max} uds). Ajusta el pedido.`,
          );
          return;
        }
      }
    } else if (
      (form.lineType === 'GLOVES' || form.lineType === 'GAME') &&
      (form.quantity < 1 || (form.unitPrice ?? 0) < 0)
    ) {
      setError('Indica cantidad y precio unitario para guantes o juego.');
      return;
    }
    setSubmitting(true);
    try {
      if (form.lineType === 'BEVERAGE' && cart.size > 0) {
        for (const [, item] of cart) {
          const payload: CreateSaleDto = {
            tableNumber: tableNumberForSubmit,
            lineType: 'BEVERAGE',
            beverageId: item.beverage.id,
            quantity: item.quantity,
          };
          await createSale(payload);
        }
        setCart(new Map());
        toast.success('Venta registrada', {
          style: { background: 'var(--success)', color: '#fff', border: 'none' },
        });
      } else if (form.lineType === 'GLOVES' || form.lineType === 'GAME') {
        const payload: CreateSaleDto = {
          tableNumber: tableNumberForSubmit,
          lineType: form.lineType,
          quantity: form.quantity,
          unitPrice: form.unitPrice ?? 0,
        };
        if (form.description) payload.description = form.description;
        await createSale(payload);
        setForm((f) => ({ ...f, quantity: 1, unitPrice: 0, description: '' }));
        toast.success('Venta registrada', {
          style: { background: 'var(--success)', color: '#fff', border: 'none' },
        });
      }
      onRegistered();
    } catch (err) {
      setError((err as Error)?.message ?? 'Error al registrar la venta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={cn(
        'glass overflow-hidden rounded-2xl border border-[var(--border)]',
        form.lineType === 'BEVERAGE' && 'lg:flex lg:max-h-[min(calc(100dvh-11rem),900px)] lg:flex-col',
      )}
      aria-label="Registro de venta"
    >
      <form onSubmit={handleSubmit} className={cn('flex flex-col', form.lineType === 'BEVERAGE' && 'lg:min-h-0 lg:flex-1')}>
        <div
          className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-surface)]/40 px-2 sm:px-4"
          role="tablist"
          aria-label="Tipo de venta"
        >
          <div className="flex flex-col gap-2 pt-2 pb-2 sm:flex-row sm:items-stretch sm:justify-between sm:gap-3 sm:pb-2">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SALE_TABS.map((tab) => {
                const active = form.lineType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        lineType: tab.id,
                        beverageId: tab.id === 'BEVERAGE' ? f.beverageId : '',
                        unitPrice: 0,
                        description: '',
                      }))
                    }
                    className={cn(
                      'shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors',
                      active
                        ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)] shadow-sm -mb-px'
                        : 'border border-transparent border-b-0 text-[var(--text-primary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    {tab.short}
                  </button>
                );
              })}
            </div>
            {form.lineType !== 'BEVERAGE' && (
              <div className="flex shrink-0 flex-row items-center justify-end gap-3 sm:justify-end sm:pl-2">
                <Button type="submit" disabled={submitting} className="shrink-0">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Guardar
                    </span>
                  ) : (
                    'Registrar venta'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {form.lineType === 'BEVERAGE' && (
          <SalesRegisterBeveragePanel
            beverageSearch={beverageSearch}
            setBeverageSearch={setBeverageSearch}
            beverageSearchDebounced={beverageSearchDebounced}
            beverages={beverages}
            beveragesLoading={beveragesLoading}
            beveragesError={beveragesError}
            beveragePage={beveragePage}
            setBeveragePage={setBeveragePage}
            beverageTotalPages={beverageTotalPages}
            beverageTotal={beverageTotal}
            cart={cart}
            cartItems={cartItems}
            cartUnits={cartUnits}
            cartTotal={cartTotal}
            addToCart={addToCart}
            updateCartQuantity={updateCartQuantity}
            assignToTable={assignToTable}
            setAssignToTable={setAssignToTable}
            mesaNumber={mesaNumber}
            setMesaNumber={setMesaNumber}
            submitting={submitting}
          />
        )}

        {(form.lineType === 'GLOVES' || form.lineType === 'GAME') && (
          <div className="p-4 sm:p-6">
            <div className="mx-auto flex max-w-lg flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/40 p-5">
              <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-primary)]">
                  ¿Dónde se sirve?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignToTable(true)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      assignToTable
                        ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                        : 'border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]',
                    )}
                  >
                    Mesa de billar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignToTable(false)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      !assignToTable
                        ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                        : 'border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]',
                    )}
                  >
                    Bar / venta directa
                  </button>
                </div>
                {assignToTable && (
                  <div>
                    <label
                      htmlFor="mesa-gloves"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      Mesa
                    </label>
                    <select
                      id="mesa-gloves"
                      value={mesaNumber}
                      onChange={(e) => setMesaNumber(Number(e.target.value))}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
                    >
                      {TABLES.map((t) => (
                        <option key={t} value={t}>
                          Mesa {t}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="w-28">
                  <label
                    htmlFor="qty"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Cantidad
                  </label>
                  <input
                    id="qty"
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
                <div className="w-40">
                  <label
                    htmlFor="unitPrice"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Precio unit. (COP)
                  </label>
                  <input
                    id="unitPrice"
                    type="number"
                    min={0}
                    step={100}
                    value={form.unitPrice ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unitPrice: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
                <div className="min-w-[200px] flex-1">
                  <label
                    htmlFor="description"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Descripción (opcional)
                  </label>
                  <input
                    id="description"
                    type="text"
                    placeholder={form.lineType === 'GLOVES' ? 'Ej. Guantes mesa 2' : 'Ej. Chicos / Buchacara'}
                    value={form.description ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="border-t border-[var(--border)] bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400 sm:px-6" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
