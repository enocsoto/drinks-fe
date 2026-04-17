'use client';

import React, { useEffect, useState } from 'react';
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
import { TableSkeleton } from '../_components/table-skeleton';
import { InventoryModals } from './_components/inventory-modals';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

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
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[19%]" />
                  <col className="w-[15%]" />
                  <col className="w-[9%]" />
                  <col className="w-[7%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[7%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">Imagen</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">Nombre</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">Envase</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">Tipo</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-[var(--text-secondary)]">
                      Cantidad
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--text-secondary)]">
                      Venta (COP)
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--text-secondary)]">
                      Costo (COP)
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-[var(--text-secondary)]">Margen</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-[var(--text-secondary)]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {beverages.map((b) => (
                    <tr
                      key={b.id}
                      className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface)]/50 ${!b.isActive ? 'opacity-60' : ''}`}
                    >
                      <td className="px-3 py-2">
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
                      <td className="min-w-0 px-3 py-2 font-medium text-[var(--text-primary)]">
                        <span className="block truncate" title={b.name}>
                          {b.name}
                        </span>
                      </td>
                      <td className="min-w-0 px-3 py-2 text-[var(--text-secondary)]">
                        <span
                          className="block truncate"
                          title={
                            b.containerType && CONTAINER_TYPE_LABELS[b.containerType as ContainerType]
                              ? CONTAINER_TYPE_LABELS[b.containerType as ContainerType]
                              : b.containerSize || '—'
                          }
                        >
                          {b.containerType && CONTAINER_TYPE_LABELS[b.containerType as ContainerType]
                            ? CONTAINER_TYPE_LABELS[b.containerType as ContainerType]
                            : b.containerSize || '—'}
                        </span>
                      </td>
                      <td
                        className="min-w-0 truncate px-3 py-2 text-[var(--text-secondary)]"
                        title={String(DRINK_TYPE_LABELS[String(b.type)] ?? b.type)}
                      >
                        {DRINK_TYPE_LABELS[String(b.type)] ?? b.type}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold tabular-nums text-[var(--text-primary)]">
                        {(b.stock ?? 0).toLocaleString('es-CO')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-[var(--text-secondary)]">
                        {formatMoney(b.price)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-[var(--text-secondary)]">
                        {(b.costPrice ?? 0) > 0 ? formatMoney(b.costPrice ?? 0) : '—'}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">
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
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => setReceivingBeverage(b)}
                            title="Recibir inventario"
                            aria-label={`Recibir inventario de ${b.name}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/50 text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] disabled:opacity-50"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStock(b)}
                            title="Ajustar cantidad"
                            aria-label={`Ajustar cantidad de ${b.name}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/50 text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBeverageToDelete(b)}
                            disabled={deletingId === b.id}
                            title="Eliminar"
                            aria-label={`Eliminar ${b.name}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/35 bg-red-500/10 text-red-600 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 disabled:opacity-50 dark:text-red-400"
                          >
                            {deletingId === b.id ? (
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
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

      <InventoryModals
        beverageToDelete={beverageToDelete}
        setBeverageToDelete={setBeverageToDelete}
        editingStock={editingStock}
        setEditingStock={setEditingStock}
        receivingBeverage={receivingBeverage}
        setReceivingBeverage={setReceivingBeverage}
        showCreate={showCreate}
        setShowCreate={setShowCreate}
        saving={saving}
        deletingId={deletingId}
        setError={setError}
        onDeleteConfirm={handleDelete}
        onStockSubmit={handleStockSubmit}
        onReceiveSubmit={handleReceiveSubmit}
        onCreateSubmit={handleCreateSubmit}
      />
    </AdminGuard>
  );
}
