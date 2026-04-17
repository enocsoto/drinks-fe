'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BeverageDto } from '@/types/beverage.types';
import { CONTAINER_TYPE_LABELS, getBeverageImageUrl, type ContainerType } from '@/types/beverage.types';
import { cn } from '@/lib/utils';

const TABLES = [1, 2, 3, 4, 5, 6] as const;

type CartItem = { beverage: BeverageDto; quantity: number };

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

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

const qtyBtnClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--brand-primary)]/35 bg-[var(--brand-accent)]/40 text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-accent)] disabled:pointer-events-none disabled:opacity-35';

export type SalesRegisterBeveragePanelProps = {
  beverageSearch: string;
  setBeverageSearch: (v: string) => void;
  beverageSearchDebounced: string;
  beverages: BeverageDto[];
  beveragesLoading: boolean;
  beveragesError: string | null;
  beveragePage: number;
  setBeveragePage: React.Dispatch<React.SetStateAction<number>>;
  beverageTotalPages: number;
  beverageTotal: number;
  cart: Map<string, CartItem>;
  cartItems: CartItem[];
  cartUnits: number;
  cartTotal: number;
  addToCart: (beverage: BeverageDto) => void;
  updateCartQuantity: (beverageId: string, delta: number) => void;
  assignToTable: boolean;
  setAssignToTable: (v: boolean) => void;
  mesaNumber: number;
  setMesaNumber: (v: number) => void;
  submitting: boolean;
};

export function SalesRegisterBeveragePanel({
  beverageSearch,
  setBeverageSearch,
  beverageSearchDebounced,
  beverages,
  beveragesLoading,
  beveragesError,
  beveragePage,
  setBeveragePage,
  beverageTotalPages,
  beverageTotal,
  cart,
  cartItems,
  cartUnits,
  cartTotal,
  addToCart,
  updateCartQuantity,
  assignToTable,
  setAssignToTable,
  mesaNumber,
  setMesaNumber,
  submitting,
}: SalesRegisterBeveragePanelProps) {
  return (
    <div className="grid min-h-0 grid-cols-1 overflow-hidden lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:items-stretch">
      <div className="flex min-h-0 min-w-0 flex-col border-[var(--border)] lg:max-h-full lg:border-b-0 lg:border-r">
        <div className="sticky top-0 z-[1] border-b border-[var(--border)] bg-[var(--bg-base)]/95 p-4 backdrop-blur-sm">
          <label htmlFor="beverage-search" className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]">
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
                            {maxLine > 0 && <span className="ml-1 text-[var(--text-primary)]">· máx. {maxLine}</span>}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            className={qtyBtnClass}
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
                            className={qtyBtnClass}
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
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-primary)]">¿Dónde se sirve?</p>
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
                <label htmlFor="mesa-select" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
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
  );
}
