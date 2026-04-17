'use client';

import { createPortal } from 'react-dom';
import type { BeverageDto } from '@/types/beverage.types';
import {
  CONTAINER_TYPE_LABELS,
  DRINK_TYPE_LABELS,
  type ContainerType,
} from '@/types/beverage.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CONTAINER_OPTIONS = Object.entries(CONTAINER_TYPE_LABELS) as [ContainerType, string][];
const DRINK_OPTIONS = Object.entries(DRINK_TYPE_LABELS).filter(([, v]) => v != null) as [string, string][];

type Props = {
  beverageToDelete: BeverageDto | null;
  setBeverageToDelete: (v: BeverageDto | null) => void;
  editingStock: BeverageDto | null;
  setEditingStock: (v: BeverageDto | null) => void;
  receivingBeverage: BeverageDto | null;
  setReceivingBeverage: (v: BeverageDto | null) => void;
  showCreate: boolean;
  setShowCreate: (v: boolean) => void;
  saving: boolean;
  deletingId: string | null;
  setError: (v: string | null) => void;
  onDeleteConfirm: (b: BeverageDto) => void;
  onStockSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onReceiveSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCreateSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function InventoryModals({
  beverageToDelete,
  setBeverageToDelete,
  editingStock,
  setEditingStock,
  receivingBeverage,
  setReceivingBeverage,
  showCreate,
  setShowCreate,
  saving,
  deletingId,
  setError,
  onDeleteConfirm,
  onStockSubmit,
  onReceiveSubmit,
  onCreateSubmit,
}: Props) {
  return (
    <>
      {beverageToDelete &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
          >
            <div className="glass rounded-xl border border-[var(--border)] w-full max-w-sm shadow-lg">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h2 id="delete-confirm-title" className="text-lg font-semibold text-[var(--text-primary)]">
                  Confirmar eliminación
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  ¿Eliminar &quot;{beverageToDelete.name}&quot; ({beverageToDelete.containerSize ||
                  CONTAINER_TYPE_LABELS[beverageToDelete.containerType as ContainerType]}
                  )? No se mostrará en el catálogo.
                </p>
              </div>
              <div className="p-5 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBeverageToDelete(null)}
                  disabled={deletingId === beverageToDelete.id}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => beverageToDelete && onDeleteConfirm(beverageToDelete)}
                  disabled={deletingId === beverageToDelete.id}
                >
                  {deletingId === beverageToDelete.id ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {editingStock &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
          >
            <div className="glass rounded-xl border border-[var(--border)] w-full max-w-sm shadow-lg">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h2 id="stock-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                  Ajustar cantidad — {editingStock.name}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {CONTAINER_TYPE_LABELS[editingStock.containerType as ContainerType] || editingStock.containerSize}
                </p>
              </div>
              <form onSubmit={onStockSubmit} className="p-5 space-y-4">
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Cantidad en inventario
                  </label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min={0}
                    defaultValue={editingStock.stock ?? 0}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="costPrice" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Precio de coste unitario (COP, opcional)
                  </label>
                  <Input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    min={0}
                    step={100}
                    defaultValue={editingStock.costPrice ?? ''}
                    placeholder="Ej. 1800"
                    className="w-full"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Ej: canasta 68.000 con 38 unidades → 1.800 COP/unidad
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingStock(null)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {receivingBeverage &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receive-modal-title"
          >
            <div className="glass rounded-xl border border-[var(--border)] w-full max-w-sm shadow-lg">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h2 id="receive-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                  Recibir inventario — {receivingBeverage.name}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {CONTAINER_TYPE_LABELS[receivingBeverage.containerType as ContainerType] || receivingBeverage.containerSize}
                </p>
              </div>
              <form onSubmit={onReceiveSubmit} className="p-5 space-y-4">
                <div>
                  <label htmlFor="receive-quantity" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Cantidad a añadir
                  </label>
                  <Input
                    id="receive-quantity"
                    name="receive-quantity"
                    type="number"
                    min={1}
                    required
                    defaultValue={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="receive-costTotal" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Costo total del lote (COP, opcional)
                  </label>
                  <Input
                    id="receive-costTotal"
                    name="receive-costTotal"
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="Ej. 68000"
                    className="w-full"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Si indicas el costo, se calculará el precio unitario. Ej: canasta 68.000 con 38 unidades → 1.800
                    COP/unidad
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Guardando...' : 'Recibir'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReceivingBeverage(null)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {showCreate &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-beverage-title"
          >
            <div className="glass rounded-xl border border-[var(--border)] w-full max-w-md shadow-lg my-8">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h2 id="create-beverage-title" className="text-lg font-semibold text-[var(--text-primary)]">
                  Crear bebida
                </h2>
              </div>
              <form onSubmit={onCreateSubmit} className="p-5 space-y-4">
                <div>
                  <label htmlFor="new-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Nombre
                  </label>
                  <Input id="new-name" name="new-name" required placeholder="Ej. Aguila Negra" className="w-full" />
                </div>
                <div>
                  <label htmlFor="new-price" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Precio (COP)
                  </label>
                  <Input id="new-price" name="new-price" type="number" min={1} required defaultValue={0} className="w-full" />
                </div>
                <div>
                  <label htmlFor="new-stock" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Cantidad inicial
                  </label>
                  <Input id="new-stock" name="new-stock" type="number" min={0} defaultValue={0} className="w-full" />
                </div>
                <div>
                  <label htmlFor="new-costPrice" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Precio de coste unitario (COP, opcional)
                  </label>
                  <Input
                    id="new-costPrice"
                    name="new-costPrice"
                    type="number"
                    min={0}
                    step={100}
                    placeholder="Ej. 1800"
                    className="w-full"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Para calcular margen. Ej: canasta 68.000 con 38 unidades → 1.800 COP/unidad
                  </p>
                </div>
                <div>
                  <label htmlFor="new-type" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Tipo
                  </label>
                  <select
                    id="new-type"
                    name="new-type"
                    defaultValue="ALCOHOLICA"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  >
                    {DRINK_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-containerType" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Envase
                  </label>
                  <select
                    id="new-containerType"
                    name="new-containerType"
                    required
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  >
                    {CONTAINER_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-containerSize" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Talla envase (opcional)
                  </label>
                  <Input id="new-containerSize" name="new-containerSize" placeholder="Ej. 350 ml" className="w-full" />
                </div>
                <div>
                  <label htmlFor="new-imageUrl" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Imagen (ruta, opcional)
                  </label>
                  <Input id="new-imageUrl" name="new-imageUrl" placeholder="/beverages/nombre.png" className="w-full" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Creando...' : 'Crear'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreate(false);
                      setError(null);
                    }}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
