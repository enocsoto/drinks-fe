'use client';

import { useEffect, useState } from 'react';
import { getBeverages, createBeverage, updateBeverage, deleteBeverage } from '@/lib/api/beverages.api';
import type { BeverageDto, CreateBeverageDto, UpdateBeverageDto } from '@/types/beverage.types';
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

export default function BeveragesPage() {
  const [beverages, setBeverages] = useState<BeverageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<BeverageDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBeverages = () => {
    setLoading(true);
    getBeverages({ limit: 1000 })
      .then((res) => setBeverages(res.data ?? []))
      .catch(() => setBeverages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    getBeverages({ limit: 1000 })
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

  const handleUpdate = (b: BeverageDto) => {
    setError(null);
    setEditing(b);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing?.id) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get('name') as string)?.trim() ?? '';
    const price = Number(data.get('price')) || 0;
    const type = (data.get('type') as string) ?? editing.type;
    const containerType = (data.get('containerType') as ContainerType) ?? editing.containerType;
    const containerSize = (data.get('containerSize') as string)?.trim() ?? '';
    const imageUrl = (data.get('imageUrl') as string)?.trim() ?? '';

    if (!name || price < 1) {
      setError('Nombre y precio son obligatorios.');
      return;
    }

    const dto: UpdateBeverageDto = {
      name,
      price,
      type,
      containerType,
      containerSize,
      imageUrl: imageUrl || undefined,
    };

    setSaving(true);
    setError(null);
    updateBeverage(editing.id, dto)
      .then(() => {
        setEditing(null);
        loadBeverages();
      })
      .catch((err) => setError(err?.message ?? 'Error al guardar.'))
      .finally(() => setSaving(false));
  };

  const handleDelete = (b: BeverageDto) => {
    if (
      !confirm(
        `¿Eliminar "${b.name}" (${b.containerSize || CONTAINER_TYPE_LABELS[b.containerType as ContainerType]})? No se mostrará en el catálogo.`,
      )
    )
      return;
    setDeletingId(b.id);
    deleteBeverage(b.id)
      .then(() => loadBeverages())
      .catch(() => setError('Error al eliminar.'))
      .finally(() => setDeletingId(null));
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
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Catálogo de bebidas</h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">
              Solo administradores. Crear, editar y eliminar productos (envase y precio).
            </p>
          </div>
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

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="glass rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bebidas</h2>
          </div>
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : beverages.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">
              No hay bebidas. Ejecuta el seed en el backend.
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
                    <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3">Precio (COP)</th>
                    <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3 w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {beverages.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface)]/50"
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
                      <td className="px-5 py-3 text-right font-medium text-[var(--text-primary)]">
                        {formatMoney(b.price)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdate(b)}
                            aria-label={`Editar ${b.name}`}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(b)}
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

      {/* Modal crear */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-beverage-title"
        >
          <div className="glass rounded-xl border border-[var(--border)] w-full max-w-md shadow-lg">
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
                <Input
                  id="new-price"
                  name="new-price"
                  type="number"
                  min={1}
                  required
                  defaultValue={0}
                  className="w-full"
                />
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
                <label
                  htmlFor="new-containerType"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
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
                <label
                  htmlFor="new-containerSize"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Talla / descripción envase (opcional)
                </label>
                <Input id="new-containerSize" name="new-containerSize" placeholder="Ej. 350 ml" className="w-full" />
              </div>
              <div>
                <label htmlFor="new-imageUrl" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Imagen (ruta, opcional)
                </label>
                <Input
                  id="new-imageUrl"
                  name="new-imageUrl"
                  placeholder="Ej. /beverages/agua-cristal.png"
                  className="w-full"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Sube el archivo en <code className="rounded bg-[var(--bg-surface)] px-1">public/beverages/</code> y
                  escribe la ruta <code className="rounded bg-[var(--bg-surface)] px-1">/beverages/nombre.png</code>.
                </p>
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
        </div>
      )}

      {/* Modal editar */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-beverage-title"
        >
          <div className="glass rounded-xl border border-[var(--border)] w-full max-w-md shadow-lg">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h2 id="edit-beverage-title" className="text-lg font-semibold text-[var(--text-primary)]">
                Editar bebida
              </h2>
            </div>
            <form key={editing.id} onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Nombre
                </label>
                <Input id="edit-name" name="name" defaultValue={editing.name} required className="w-full" />
              </div>
              <div>
                <label htmlFor="edit-price" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Precio (COP)
                </label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  min={1}
                  defaultValue={editing.price}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="edit-type" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Tipo
                </label>
                <select
                  id="edit-type"
                  name="type"
                  defaultValue={editing.type}
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
                <label
                  htmlFor="edit-containerType"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Envase
                </label>
                <select
                  id="edit-containerType"
                  name="containerType"
                  defaultValue={editing.containerType ?? ''}
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
                <label
                  htmlFor="edit-containerSize"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Talla / descripción envase (opcional)
                </label>
                <Input
                  id="edit-containerSize"
                  name="containerSize"
                  defaultValue={editing.containerSize ?? ''}
                  placeholder="Ej. 350 ml"
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-imageUrl"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Imagen (ruta)
                </label>
                <Input
                  id="edit-imageUrl"
                  name="imageUrl"
                  defaultValue={editing.imageUrl ?? ''}
                  placeholder="Ej. /beverages/agua-cristal.png"
                  className="w-full"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Ruta desde la raíz. Sube el archivo en{' '}
                  <code className="rounded bg-[var(--bg-surface)] px-1">public/beverages/</code> y usa{' '}
                  <code className="rounded bg-[var(--bg-surface)] px-1">/beverages/nombre.png</code>.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setError(null);
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
