'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSales, createSale } from '@/lib/api/sales.api';
import { getBeverages } from '@/lib/api/beverages.api';
import type { SaleDto, CreateSaleDto, SaleDetailType, SaleDetailDto } from '@/types/sale.types';
import {
  saleHasBeverageDetails,
  saleHasBilliardDetails,
  filterBeverageDetails,
  filterBilliardDetails,
} from '@/types/sale.types';
import type { BeverageDto } from '@/types/beverage.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CONTAINER_TYPE_LABELS, getBeverageImageUrl, type ContainerType } from '@/types/beverage.types';
import { SALE_DETAIL_TYPE_LABELS } from '@/types/sale.types';
import { TableSkeleton } from '../_components/table-skeleton';
import { BeverageGridSkeleton } from '../_components/beverage-grid-skeleton';
import { todayColombia, formatDateTimeColombia } from '@/lib/date-colombia';
import { toast } from 'sonner';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

const TABLES = [1, 2, 3, 4, 5, 6] as const;

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleDto[]>([]);
  const [summary, setSummary] = useState<Array<{ sellerId: number; name?: string; totalQuantity: number }>>([]);
  const [beverages, setBeverages] = useState<BeverageDto[]>([]);
  const [beveragesError, setBeveragesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState(() => todayColombia());
  const [form, setForm] = useState<CreateSaleDto>({
    tableNumber: 1,
    lineType: 'BEVERAGE',
    beverageId: '',
    quantity: 1,
    unitPrice: 0,
    description: '',
  });
  // Carrito: varias bebidas con cantidad antes de registrar
  type CartItem = { beverage: BeverageDto; quantity: number };
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [beverageSearch, setBeverageSearch] = useState('');
  const [beverageSearchDebounced, setBeverageSearchDebounced] = useState('');
  const [beveragePage, setBeveragePage] = useState(1);
  const [beverageTotalPages, setBeverageTotalPages] = useState(1);
  const [beverageTotal, setBeverageTotal] = useState(0);
  const BEVERAGE_PAGE_SIZE = 10;

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSales(filterDate);
      setSales(res.sales ?? []);
      setSummary(res.summary ?? []);
    } catch {
      setSales([]);
      setSummary([]);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  const loadBeverages = useCallback(async (page: number, search: string) => {
    setBeveragesError(null);
    try {
      const res = await getBeverages({
        page,
        limit: BEVERAGE_PAGE_SIZE,
        search: search.trim() || undefined,
      });
      const arr = res.data ?? [];
      setBeverages(arr);
      setBeverageTotalPages(res.totalPages ?? 1);
      setBeverageTotal(res.total ?? 0);
      // No preseleccionar bebida: todas muestran cantidad 0 hasta que el usuario elija una
    } catch (err) {
      setBeverages([]);
      setBeverageTotalPages(1);
      setBeverageTotal(0);
      const msg = err instanceof Error ? err.message : String(err);
      setBeveragesError(
        msg ||
          'No se pudieron cargar las bebidas. Revisa que el backend (drinks-be) esté en marcha en el puerto esperado y que hayas ejecutado el seed: npm run seed.',
      );
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    loadBeverages(beveragePage, beverageSearchDebounced);
  }, [beveragePage, beverageSearchDebounced, loadBeverages]);

  // Debounce búsqueda y volver a página 1
  useEffect(() => {
    const t = setTimeout(() => {
      setBeverageSearchDebounced(beverageSearch);
      setBeveragePage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [beverageSearch]);

  const addToCart = (beverage: BeverageDto) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(beverage.id);
      if (existing) {
        next.set(beverage.id, { ...existing, quantity: existing.quantity + 1 });
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
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        next.delete(beverageId);
      } else {
        next.set(beverageId, { ...item, quantity: newQty });
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.lineType === 'BEVERAGE') {
      if (cart.size === 0) {
        setError('Añade al menos una bebida al carrito (clic en la card).');
        return;
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
            tableNumber: form.tableNumber,
            lineType: 'BEVERAGE',
            beverageId: item.beverage.id,
            quantity: item.quantity,
          };
          await createSale(payload);
        }
        setCart(new Map());
        toast.success('Venta registrada', {
          style: { background: 'var(--success-bg, #22c55e)', color: '#fff', border: 'none' },
        });
      } else if (form.lineType === 'GLOVES' || form.lineType === 'GAME') {
        const payload: CreateSaleDto = {
          tableNumber: form.tableNumber,
          lineType: form.lineType,
          quantity: form.quantity,
          unitPrice: form.unitPrice ?? 0,
        };
        if (form.description) payload.description = form.description;
        await createSale(payload);
        setForm((f) => ({ ...f, quantity: 1, unitPrice: 0, description: '' }));
        toast.success('Venta registrada', {
          style: { background: 'var(--success-bg, #22c55e)', color: '#fff', border: 'none' },
        });
      }
      await loadSales();
    } catch (err) {
      setError((err as Error)?.message ?? 'Error al registrar la venta.');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Ventas</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Bebidas por mesa y ventas del billar (guantes, juegos). Sesión:{' '}
            <span className="font-medium text-[var(--text-secondary)]">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-date" className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
            Fecha
          </label>
          <input
            id="filter-date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
          />
        </div>
      </div>

      {/* Registrar venta */}
      <section className="glass p-6 rounded-xl border border-[var(--border)]" aria-labelledby="registrar-venta-heading">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Encabezado: título + botón principal arriba */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <h2 id="registrar-venta-heading" className="text-lg font-semibold text-[var(--text-primary)]">
              Registrar venta
            </h2>
            <Button
              type="submit"
              disabled={submitting || (form.lineType === 'BEVERAGE' && cart.size === 0)}
              className="w-full sm:w-auto shrink-0"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Guardar
                </span>
              ) : (
                'Registrar venta'
              )}
            </Button>
          </div>

          {/* Mesa y tipo de venta: una columna (como mobile) hasta xl; desde 1280px mesa compacta + tipo */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]/50 p-3 sm:p-4 space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-4 items-stretch">
              <div className="w-full xl:w-36 min-w-0">
                <label htmlFor="table" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Mesa
                </label>
                <select
                  id="table"
                  value={form.tableNumber}
                  onChange={(e) => setForm((f) => ({ ...f, tableNumber: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  aria-label="Número de mesa"
                >
                  {TABLES.map((t) => (
                    <option key={t} value={t}>
                      Mesa {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 w-full">
                <span id="lineType-label" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Tipo de venta
                </span>
                <div className="flex flex-col gap-2" role="group" aria-labelledby="lineType-label">
                  {(Object.keys(SALE_DETAIL_TYPE_LABELS) as SaleDetailType[]).map((t) => (
                    <label
                      key={t}
                      className={`
                        flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm w-full min-w-0
                        ${
                          form.lineType === t
                            ? 'border-[var(--border-focus)] bg-[var(--brand-accent)] text-[var(--text-primary)] ring-2 ring-[var(--border-focus)]'
                            : 'border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="lineType"
                        value={t}
                        checked={form.lineType === t}
                        onChange={() =>
                          setForm((f) => ({
                            ...f,
                            lineType: t as SaleDetailType,
                            beverageId: t === 'BEVERAGE' ? f.beverageId : '',
                            unitPrice: 0,
                            description: '',
                          }))
                        }
                        className="sr-only"
                      />
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded border-2 border-current shrink-0"
                        aria-hidden
                      >
                        {form.lineType === t && <span className="w-2 h-2 rounded-full bg-current" />}
                      </span>
                      <span className="truncate">{SALE_DETAIL_TYPE_LABELS[t]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {form.lineType === 'BEVERAGE' && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="beverage-search"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Buscar bebida por nombre
                </label>
                <Input
                  id="beverage-search"
                  type="search"
                  placeholder="Ej. Cerveza, Aguardiente, Coca..."
                  value={beverageSearch}
                  onChange={(e) => setBeverageSearch(e.target.value)}
                  className="max-w-md"
                  autoComplete="off"
                />
              </div>
              {beveragesError && (
                <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
                  {beveragesError}
                </p>
              )}
              {loading && <BeverageGridSkeleton />}
              {!loading && !beveragesError && beverages.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">
                  No hay bebidas en el catálogo. Ejecuta el seed en el backend:{' '}
                  <code className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-xs">npm run seed</code> (en
                  drinks-be).
                </p>
              )}
              {!loading && !beveragesError && beverages.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {beverages.map((b) => {
                      const cartItem = cart.get(b.id);
                      const qty = cartItem?.quantity ?? 0;
                      const isInCart = qty > 0;
                      return (
                        <div
                          key={b.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => addToCart(b)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              addToCart(b);
                            }
                          }}
                          className={`
                          flex flex-col rounded-lg border overflow-hidden transition-all min-w-0 cursor-pointer
                          ${
                            isInCart
                              ? 'border-[var(--border-focus)] ring-2 ring-[var(--border-focus)] bg-[var(--brand-accent)]/30'
                              : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)]'
                          }
                        `}
                          aria-label={`Añadir 1 ${b.name} al carrito`}
                        >
                          <div className="h-44 sm:h-52 lg:h-56 bg-[var(--bg-base)] flex items-center justify-center p-3 relative shrink-0">
                            {(() => {
                              const imgUrl = b.imageUrl || getBeverageImageUrl(b.name, b.containerType);
                              return imgUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element -- imágenes dinámicas desde public/beverages
                                <img src={imgUrl} alt="" className="w-full h-full object-contain rounded" />
                              ) : (
                                <div
                                  className="w-full h-full rounded flex items-center justify-center text-2xl font-bold text-[var(--text-muted)] bg-[var(--bg-surface)]"
                                  title={b.name}
                                >
                                  {b.name.slice(0, 2).toUpperCase()}
                                </div>
                              );
                            })()}
                          </div>
                          <div className="p-2 flex flex-col gap-0.5">
                            <p className="font-medium text-[var(--text-primary)] text-xs truncate" title={b.name}>
                              {b.name}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">
                              {b.containerType && CONTAINER_TYPE_LABELS[b.containerType as ContainerType]
                                ? CONTAINER_TYPE_LABELS[b.containerType as ContainerType]
                                : b.containerSize || '—'}
                            </p>
                            <p className="font-semibold text-[var(--text-primary)] text-xs">{formatMoney(b.price)}</p>
                            <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(b.id, -1)}
                                className="flex items-center justify-center w-7 h-7 rounded border border-red-500/50 bg-red-500/10 text-red-600 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 shrink-0 dark:text-red-400 dark:border-red-400/50 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                                aria-label="Menos"
                                disabled={qty <= 0}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="flex-1 text-center font-medium text-[var(--text-primary)] text-xs min-w-[1.25rem]">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart(b)}
                                className="flex items-center justify-center w-7 h-7 rounded border border-red-500/50 bg-red-500/10 text-red-600 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 shrink-0 dark:text-red-400 dark:border-red-400/50 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                                aria-label="Más"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {cart.size > 0 && (
                    <div className="mt-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
                      <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Carrito ({Array.from(cart.values()).reduce((s, i) => s + i.quantity, 0)} unidades)
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {Array.from(cart.values()).map((item) => (
                          <li
                            key={item.beverage.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-base)] border border-[var(--border)] text-sm"
                          >
                            <span className="text-[var(--text-primary)] truncate max-w-[140px]">
                              {item.beverage.name}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">×{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.beverage.id, -1)}
                              className="ml-1 text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded p-0.5 dark:text-red-400"
                              aria-label={`Quitar 1 ${item.beverage.name}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)]">
                      Mostrando {beverages.length} de {beverageTotal} bebida{beverageTotal !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setBeveragePage((p) => Math.max(1, p - 1))}
                        disabled={beveragePage <= 1}
                        className="min-w-[80px]"
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-[var(--text-secondary)] px-2">
                        Página {beveragePage} de {beverageTotalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setBeveragePage((p) => Math.min(beverageTotalPages, p + 1))}
                        disabled={beveragePage >= beverageTotalPages}
                        className="min-w-[80px]"
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="submit"
                      disabled={submitting || (form.lineType === 'BEVERAGE' && cart.size === 0)}
                      className="w-full sm:w-auto min-w-[140px]"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Guardar
                        </span>
                      ) : (
                        'Registrar venta'
                      )}
                    </Button>
                  </div>
                </>
              )}
              {beverages.length === 0 && beverageSearchDebounced.trim() && (
                <p className="text-sm text-[var(--text-muted)]">
                  No hay bebidas que coincidan con &quot;{beverageSearchDebounced.trim()}&quot;.
                </p>
              )}
            </div>
          )}

          {(form.lineType === 'GLOVES' || form.lineType === 'GAME') && (
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-28">
                <label htmlFor="qty" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Cantidad
                </label>
                <input
                  id="qty"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
              </div>
              <div className="w-36">
                <label htmlFor="unitPrice" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
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
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label htmlFor="description" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Descripción (opcional)
                </label>
                <input
                  id="description"
                  type="text"
                  placeholder={form.lineType === 'GLOVES' ? 'Ej. Guantes mesa 2' : 'Ej. Chicos / Buchacara'}
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
              </div>
            </div>
          )}
        </form>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </section>

      {summary.length > 0 && (
        <section className="glass p-5 rounded-xl border border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Resumen por vendedor</h2>
          <div className="flex flex-wrap gap-3">
            {summary.map((s) => (
              <div
                key={s.sellerId}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]"
              >
                <span className="font-medium text-[var(--text-primary)]">{s.name ?? s.sellerId}</span>
                <span className="text-sm text-[var(--text-muted)]">{s.totalQuantity} unidades</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ventas de bebidas (por mesa de billar) */}
      <section className="glass rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ventas de bebidas</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Cervezas, gaseosas, aguardiente, etc. asociadas a mesa de billar.
          </p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : beverageSales.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No hay ventas de bebidas para esta fecha.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                  <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Fecha y hora</th>
                  <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Mesa</th>
                  <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Vendedor</th>
                  <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Detalle</th>
                  <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {beverageSales.map((sale) => {
                  const beverageDetails = filterBeverageDetails(sale.details);
                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface)]/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-[var(--text-primary)] whitespace-nowrap">
                        {formatDateTimeColombia(sale.DateSale)}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">Mesa {sale.tableNumber ?? 1}</td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">{sale.user?.name ?? sale.userDocument}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">
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

      {/* Ventas del billar (guantes, juegos) */}
      <section className="glass rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ventas del billar</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Guantes, juegos (chicos, buchacara) y otros conceptos del billar.
          </p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : billiardSales.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No hay ventas del billar para esta fecha.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                  <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Fecha y hora</th>
                  <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Mesa</th>
                  <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Vendedor</th>
                  <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Detalle</th>
                  <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {billiardSales.map((sale) => {
                  const billiardDetails = filterBilliardDetails(sale.details);
                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface)]/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-[var(--text-primary)] whitespace-nowrap">
                        {formatDateTimeColombia(sale.DateSale)}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">Mesa {sale.tableNumber ?? 1}</td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">{sale.user?.name ?? sale.userDocument}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">
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
