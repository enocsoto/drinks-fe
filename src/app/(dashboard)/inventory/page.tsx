'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  getBeverages,
  updateBeverage,
  createBeverage,
  deleteBeverage,
  downloadImportTemplate,
  importBeveragesFromFile,
  receiveInventory,
} from '@/lib/api/beverages.api';
import type { BeverageDto, CreateBeverageDto } from '@/types/beverage.types';
import { AdminGuard } from '../_components/admin-guard';
import {
  CONTAINER_TYPE_LABELS,
  DRINK_TYPE_LABELS,
  getBeverageImageUrl,
  type ContainerType,
} from '@/types/beverage.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '../_components/table-skeleton';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

const CONTAINER_OPTIONS = Object.entries(CONTAINER_TYPE_LABELS) as [ContainerType, string][];
const DRINK_OPTIONS = Object.entries(DRINK_TYPE_LABELS).filter(([, v]) => v != null) as [string, string][];

export default function InventoryPage() {
  const [beverages, setBeverages] = useState<BeverageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingStock, setEditingStock] = useState<BeverageDto | null>(null);
  const [receivingBeverage, setReceivingBeverage] = useState<BeverageDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [beverageToDelete, setBeverageToDelete] = useState<BeverageDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);

  const loadBeverages = () => {
    setLoading(true);
    getBeverages({ limit: 1000, includeInactive: true })
      .then((res) => setBeverages(res.data ?? []))
      .catch(() => setBeverages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    getBeverages({ limit: 1000, includeInactive: true })
      .then((res) => {
        if (!cancelled) setBeverages(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setBeverages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStockSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStock?.id) return;
    const form = e.currentTarget;
    const stock = Math.max(0, Number((form.querySelector('[name="stock"]') as HTMLInputElement)?.value) || 0);
    const costPriceInput = (form.querySelector('[name="costPrice"]') as HTMLInputElement)?.value;
    const costPrice = costPriceInput != null && costPriceInput !== '' ? Math.max(0, Number(costPriceInput) || 0) : undefined;

    setSaving(true);
    setError(null);
    updateBeverage(editingStock.id, { stock, ...(costPrice !== undefined && { costPrice }) })
      .then(() => {
        setEditingStock(null);
        loadBeverages();
      })
      .catch((err) => setError(err?.message ?? 'Error al actualizar stock.'))
      .finally(() => setSaving(false));
  };

  const handleReceiveSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!receivingBeverage?.id) return;
    const form = e.currentTarget;
    const quantity = Math.max(1, Number((form.querySelector('[name="receive-quantity"]') as HTMLInputElement)?.value) || 0);
    const costTotalInput = (form.querySelector('[name="receive-costTotal"]') as HTMLInputElement)?.value;
    const costTotal = costTotalInput != null && costTotalInput.trim() !== '' ? Math.max(0, Number(costTotalInput) || 0) : undefined;

    setSaving(true);
    setError(null);
    receiveInventory(receivingBeverage.id, { quantity, costTotal })
      .then(() => {
        setReceivingBeverage(null);
        loadBeverages();
      })
      .catch((err) => setError(err?.message ?? 'Error al recibir inventario.'))
      .finally(() => setSaving(false));
  };

  const handleDelete = (b: BeverageDto) => {
    setDeletingId(b.id);
    setError(null);
    deleteBeverage(b.id)
      .then(() => loadBeverages())
      .catch((err) => {
        let msg = err?.message ?? 'Error al eliminar.';
        try {
          const parsed = typeof msg === 'string' && msg.startsWith('{') ? JSON.parse(msg) : null;
          if (parsed?.message) msg = parsed.message;
        } catch {
          // usar msg tal cual
        }
        setError(msg);
      })
      .finally(() => {
        setDeletingId(null);
        setBeverageToDelete(null);
      });
  };

  const handleDownloadTemplate = () => {
    setError(null);
    downloadImportTemplate().catch((err) => setError(err?.message ?? 'Error al descargar plantilla.'));
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setImportResult(null);
    setImporting(true);
    importBeveragesFromFile(file)
      .then((result) => {
        setImportResult(result);
        loadBeverages();
      })
      .catch((err) => setError(err?.message ?? 'Error al cargar archivo.'))
      .finally(() => {
        setImporting(false);
        e.target.value = '';
      });
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const dto: CreateBeverageDto = {
      name: (form.querySelector('[name="new-name"]') as HTMLInputElement)?.value?.trim() ?? '',
      price: Number((form.querySelector('[name="new-price"]') as HTMLInputElement)?.value) || 0,
      type: (form.querySelector('[name="new-type"]') as HTMLSelectElement)?.value ?? 'ALCOHOLICA',
      containerType: (form.querySelector('[name="new-containerType"]') as HTMLSelectElement)?.value as ContainerType,
      containerSize: (form.querySelector('[name="new-containerSize"]') as HTMLInputElement)?.value?.trim() || '',
      imageUrl: (form.querySelector('[name="new-imageUrl"]') as HTMLInputElement)?.value?.trim() || undefined,
      stock: Math.max(0, Number((form.querySelector('[name="new-stock"]') as HTMLInputElement)?.value) || 0),
      costPrice: Math.max(0, Number((form.querySelector('[name="new-costPrice"]') as HTMLInputElement)?.value) || 0),
    };
    if (!dto.name || dto.price < 1 || !dto.containerType) {
      setError('Nombre, precio y envase son obligatorios.');
      return;
    }
    setSaving(true);
    createBeverage(dto)
      .then(() => {
        setShowCreate(false);
        loadBeverages();
      })
      .catch((err) => setError(err?.message ?? 'Error al crear bebida.'))
      .finally(() => setSaving(false));
  };

  return (
    <AdminGuard>
      <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Inventario de bebidas</h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">
              Gestiona la cantidad de cada bebida. Crear, editar cantidad y eliminar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/beverages">
              <Button variant="outline" size="sm" type="button">
                Catálogo
              </Button>
            </Link>
            <Button variant="outline" type="button" onClick={handleDownloadTemplate}>
              Descargar plantilla
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? 'Cargando...' : 'Cargar desde Excel'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={handleImportFile}
              disabled={importing}
            />
            <Button
              type="button"
              onClick={() => {
                setShowCreate(true);
                setError(null);
              }}
            >
              Crear bebida
            </Button>
          </div>
        </div>

        {importResult && (
          <div className="glass rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Resultado de la importación</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Creadas: <strong>{importResult.created}</strong> · Actualizadas: <strong>{importResult.updated}</strong>
              {importResult.errors.length > 0 && (
                <span className="text-red-600 dark:text-red-400 ml-2">
                  · Errores: {importResult.errors.length}
                </span>
              )}
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 text-xs text-[var(--text-muted)] list-disc list-inside max-h-24 overflow-y-auto">
                {importResult.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>
                    Fila {err.row}: {err.message}
                  </li>
                ))}
                {importResult.errors.length > 10 && (
                  <li>... y {importResult.errors.length - 10} más</li>
                )}
              </ul>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="glass rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Cantidad por bebida</h2>
          </div>
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : beverages.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">
              No hay bebidas. Crea una desde el botón superior.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3 w-14">Imagen</th>
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Nombre</th>
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Envase</th>
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Tipo</th>
                    <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3">Cantidad</th>
                    <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3">Venta (COP)</th>
                    <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3">Costo (COP)</th>
                    <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3">Margen</th>
                    <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3 w-48">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {beverages.map((b) => (
                    <tr
                      key={b.id}
                      className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface)]/50 ${!b.isActive ? 'opacity-60' : ''}`}
                    >
                      <td className="px-5 py-3">
                        {(() => {
                          const imgUrl = b.imageUrl || getBeverageImageUrl(b.name, b.containerType);
                          return imgUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- imágenes dinámicas desde public/beverages
                            <img
                              src={imgUrl}
                              alt=""
                              className="h-10 w-10 object-contain rounded"
                              width={40}
                              height={40}
                            />
                          ) : (
                            <span className="inline-block h-10 w-10 rounded bg-[var(--bg-surface)]" aria-hidden />
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{b.name}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">
                        {b.containerType && CONTAINER_TYPE_LABELS[b.containerType as ContainerType]
                          ? CONTAINER_TYPE_LABELS[b.containerType as ContainerType]
                          : b.containerSize || '—'}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">
                        {DRINK_TYPE_LABELS[String(b.type)] ?? b.type}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-[var(--text-primary)]">
                        {(b.stock ?? 0).toLocaleString('es-CO')}
                      </td>
                      <td className="px-5 py-3 text-right text-[var(--text-secondary)]">{formatMoney(b.price)}</td>
                      <td className="px-5 py-3 text-right text-[var(--text-secondary)]">
                        {(b.costPrice ?? 0) > 0 ? formatMoney(b.costPrice ?? 0) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {(() => {
                          const cost = b.costPrice ?? 0;
                          const price = b.price ?? 0;
                          if (cost <= 0 || price <= 0) return '—';
                          const margin = ((price - cost) / price) * 100;
                          return (
                            <span className={margin >= 30 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-secondary)]'}>
                              {Math.round(margin)}%
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setReceivingBeverage(b)}
                            aria-label={`Recibir inventario de ${b.name}`}
                          >
                            Recibir
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingStock(b)}
                            aria-label={`Ajustar cantidad de ${b.name}`}
                          >
                            Ajustar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setBeverageToDelete(b)}
                            disabled={deletingId === b.id}
                            aria-label={`Eliminar ${b.name}`}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            {deletingId === b.id ? '...' : 'Eliminar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmar eliminación — Portal para centrar en viewport tras scroll */}
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
                  onClick={() => beverageToDelete && handleDelete(beverageToDelete)}
                  disabled={deletingId === beverageToDelete.id}
                >
                  {deletingId === beverageToDelete.id ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal ajustar cantidad — Portal para centrar en viewport tras scroll */}
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
            <form onSubmit={handleStockSubmit} className="p-5 space-y-4">
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

      {/* Modal recibir inventario — Portal para centrar en viewport tras scroll */}
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
            <form onSubmit={handleReceiveSubmit} className="p-5 space-y-4">
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
                  Si indicas el costo, se calculará el precio unitario. Ej: canasta 68.000 con 38 unidades → 1.800 COP/unidad
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

      {/* Modal crear bebida — Portal para centrar en viewport tras scroll */}
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
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
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
    </AdminGuard>
  );
}
