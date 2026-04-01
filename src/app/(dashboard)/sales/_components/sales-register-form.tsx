'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSale } from '@/lib/api/sales.api';
import { getBeverages } from '@/lib/api/beverages.api';
import type { CreateSaleDto, SaleDetailType } from '@/types/sale.types';
import { SALE_DETAIL_TYPE_LABELS } from '@/types/sale.types';
import type { BeverageDto } from '@/types/beverage.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CONTAINER_TYPE_LABELS, getBeverageImageUrl, type ContainerType } from '@/types/beverage.types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

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

function BeverageListSkeleton() {
  return (
    <div className="flex flex-col gap-0 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-[var(--border)] py-3">
          <div className="h-11 w-11 shrink-0 rounded-lg bg-[var(--border)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-[var(--border)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
            <div className="h-3 w-1/4 rounded bg-[var(--border)]" />
          </div>
        </div>
      ))}
    </div>
  );
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

  const qtyBtn =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--brand-primary)]/35 bg-[var(--brand-accent)]/40 text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-accent)] disabled:pointer-events-none disabled:opacity-35';

  return (
    <section
      className={cn(
        'glass overflow-hidden rounded-2xl border border-[var(--border)]',
        form.lineType === 'BEVERAGE' && 'lg:flex lg:max-h-[min(calc(100dvh-11rem),900px)] lg:flex-col',
      )}
      aria-labelledby="registrar-venta-heading"
    >
      <form onSubmit={handleSubmit} className={cn('flex flex-col', form.lineType === 'BEVERAGE' && 'lg:min-h-0 lg:flex-1')}>
        {/* Pestañas (izquierda) + título y acción (derecha): una sola franja para ganar altura al listado */}
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
            <div className="flex shrink-0 flex-row items-center justify-end gap-3 sm:justify-end sm:pl-2">
              <h2
                id="registrar-venta-heading"
                className="text-lg font-semibold text-[var(--text-primary)] whitespace-nowrap"
              >
                Registrar venta
              </h2>
              {form.lineType !== 'BEVERAGE' && (
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
              )}
            </div>
          </div>
        </div>

        {form.lineType === 'BEVERAGE' && (
          <div className="grid min-h-0 grid-cols-1 overflow-hidden lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:items-stretch">
            {/* Catálogo 50% */}
            <div className="flex min-h-0 min-w-0 flex-col border-[var(--border)] lg:max-h-full lg:border-b-0 lg:border-r">
              <div className="sticky top-0 z-[1] border-b border-[var(--border)] bg-[var(--bg-base)]/95 p-4 backdrop-blur-sm">
                <label
                  htmlFor="beverage-search"
                  className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                >
                  Buscar bebida
                </label>
                <Input
                  id="beverage-search"
                  type="search"
                  placeholder="Nombre, marca…"
                  value={beverageSearch}
                  onChange={(e) => setBeverageSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  autoComplete="off"
                  className="w-full"
                />
              </div>

              <div className="min-h-[200px] flex-1 overflow-y-auto lg:min-h-0">
                {beveragesError && (
                  <p className="p-4 text-sm text-amber-600 dark:text-amber-400" role="alert">
                    {beveragesError}
                  </p>
                )}
                {beveragesLoading && <BeverageListSkeleton />}
                {!beveragesLoading && !beveragesError && beverages.length === 0 && (
                  <p className="p-4 text-sm text-[var(--text-primary)]">
                    No hay bebidas en el catálogo. Ejecuta el seed en drinks-be:{' '}
                    <code className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-xs">npm run seed</code>
                  </p>
                )}
                {!beveragesLoading && !beveragesError && beverages.length > 0 && (
                  <ul className="divide-y divide-[var(--border)]">
                    {beverages.map((b) => {
                      const cartItem = cart.get(b.id);
                      const qty = cartItem?.quantity ?? 0;
                      const maxStock = stockAvailable(b);
                      const hasStock = maxStock > 0;
                      const canAddMore = hasStock && qty < maxStock;
                      const imgUrl = b.imageUrl || getBeverageImageUrl(b.name, b.containerType);
                      const presentation =
                        b.containerType && CONTAINER_TYPE_LABELS[b.containerType as ContainerType]
                          ? CONTAINER_TYPE_LABELS[b.containerType as ContainerType]
                          : b.containerSize || '—';

                      return (
                        <li key={b.id}>
                          <div
                            role={canAddMore ? 'button' : undefined}
                            tabIndex={canAddMore ? 0 : -1}
                            onClick={() => canAddMore && addToCart(b)}
                            onKeyDown={(e) => {
                              if (!canAddMore) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                addToCart(b);
                              }
                            }}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 text-left transition-colors sm:px-4',
                              canAddMore && 'cursor-pointer hover:bg-[var(--bg-surface)]/70',
                              !hasStock && 'cursor-not-allowed opacity-55',
                              hasStock && !canAddMore && 'cursor-not-allowed',
                              qty > 0 && 'bg-[var(--brand-accent)]/15',
                            )}
                            title={
                              !hasStock
                                ? 'Sin inventario'
                                : !canAddMore && qty > 0
                                  ? `Inventario máximo alcanzado (${qty}/${maxStock})`
                                  : `Añadir al pedido (disponible: ${maxStock})`
                            }
                            aria-label={
                              !hasStock
                                ? `${b.name}, sin stock`
                                : !canAddMore && qty > 0
                                  ? `${b.name}, cantidad máxima en pedido según inventario`
                                  : `Añadir ${b.name} al pedido`
                            }
                          >
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-elevated)] ring-1 ring-[var(--border)]">
                              {imgUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imgUrl} alt="" className="h-full w-full object-contain p-1" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">
                                  {b.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[var(--text-primary)]" title={b.name}>
                                {b.name}
                              </p>
                              <p className="truncate text-xs text-[var(--text-primary)]">{presentation}</p>
                              <p className="text-sm font-semibold text-[var(--text-primary)]">{formatMoney(b.price)}</p>
                              {!hasStock && (
                                <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Sin stock</p>
                              )}
                            </div>
                            {qty > 0 && (
                              <span
                                className={cn(
                                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                  qty >= maxStock
                                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
                                    : 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]',
                                )}
                                aria-hidden
                              >
                                {qty >= maxStock ? `${qty}/${maxStock}` : 'En pedido'}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!beveragesLoading && beverages.length === 0 && beverageSearchDebounced.trim() && !beveragesError && (
                  <p className="p-4 text-sm text-[var(--text-primary)]">
                    No hay resultados para &quot;{beverageSearchDebounced.trim()}&quot;.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-3 text-xs text-[var(--text-primary)] sm:px-4">
                <span>
                  {beverageTotal} bebida{beverageTotal !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBeveragePage((p) => Math.max(1, p - 1))}
                    disabled={beveragePage <= 1}
                  >
                    Ant.
                  </Button>
                  <span className="px-1 tabular-nums">
                    {beveragePage}/{beverageTotalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBeveragePage((p) => Math.min(beverageTotalPages, p + 1))}
                    disabled={beveragePage >= beverageTotalPages}
                  >
                    Sig.
                  </Button>
                </div>
              </div>
            </div>

            {/* Pedido 50%: líneas seleccionadas + mesa + registrar (sin scroll de página en lg) */}
            <div className="flex min-h-0 min-w-0 flex-col border-t border-[var(--border)] bg-[var(--bg-base)]/30 lg:h-full lg:border-t-0">
              <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                <div className="shrink-0">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Pedido seleccionado</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-primary)]">
                    Se listan las bebidas que vas agregando. Toca el catálogo (izquierda) para sumar unidades; aquí ajustas o
                    quitas.
                  </p>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/80">
                  {cartItems.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                      <p className="text-sm text-[var(--text-primary)]">Aún no hay bebidas en el pedido</p>
                      <p className="max-w-[240px] text-xs text-[var(--text-primary)]">
                        Elige en la columna izquierda; aparecerán listadas aquí.
                      </p>
                    </div>
                  ) : (
                    <>
                      <ul className="min-h-0 flex-1 divide-y divide-[var(--border)] overflow-y-auto overscroll-contain">
                        {cartItems.map((item) => {
                          const line = item.quantity * Number(item.beverage.price);
                          const maxLine = stockAvailable(item.beverage);
                          const atMaxQty = item.quantity >= maxLine;
                          return (
                            <li key={item.beverage.id} className="flex items-start gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-[var(--text-primary)]">{item.beverage.name}</p>
                                <p className="text-xs text-[var(--text-primary)]">
                                  {formatMoney(item.beverage.price)} × {item.quantity}
                                  {maxLine > 0 && (
                                    <span className="ml-1 text-[var(--text-primary)]">· máx. {maxLine}</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                                <button
                                  type="button"
                                  className={qtyBtn}
                                  aria-label="Menos"
                                  onClick={() => updateCartQuantity(item.beverage.id, -1)}
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className={qtyBtn}
                                  aria-label={atMaxQty ? 'Cantidad máxima según inventario' : 'Más'}
                                  disabled={atMaxQty || maxLine <= 0}
                                  onClick={() => addToCart(item.beverage)}
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                              <span className="w-[4.5rem] shrink-0 text-right text-sm font-semibold tabular-nums text-[var(--text-primary)] sm:w-24">
                                {formatMoney(line)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {cartItems.length > 4 && (
                        <p
                          className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-base)]/40 px-3 py-2 text-center text-[11px] leading-snug text-[var(--text-primary)]"
                          role="status"
                        >
                          Hay más líneas en el pedido: desliza hacia abajo en esta lista para verlas.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="flex shrink-0 items-center justify-between border-t border-[var(--border)] pt-3 text-sm">
                    <span className="text-[var(--text-primary)]">{cartUnits} uds</span>
                    <span className="text-base font-bold text-[var(--text-primary)]">{formatMoney(cartTotal)}</span>
                  </div>
                )}

                <div className="shrink-0 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/50 p-3 sm:p-4">
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
                          : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
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
                          : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
                      )}
                    >
                      Bar / venta directa
                    </button>
                  </div>
                  {assignToTable && (
                    <div>
                      <label
                        htmlFor="mesa-select"
                        className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        Número de mesa
                      </label>
                      <select
                        id="mesa-select"
                        value={mesaNumber}
                        onChange={(e) => setMesaNumber(Number(e.target.value))}
                        className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                      >
                        {TABLES.map((t) => (
                          <option key={t} value={t}>
                            Mesa {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {!assignToTable && (
                    <p className="text-xs text-[var(--text-primary)]">
                      La venta quedará registrada sin mesa asignada (mostrador / bar).
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting || cart.size === 0}
                  className="h-12 w-full shrink-0 text-base font-semibold sm:h-14"
                  size="lg"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Registrando…
                    </span>
                  ) : (
                    'Registrar venta'
                  )}
                </Button>
              </div>
            </div>
          </div>
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
