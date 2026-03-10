'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getBeverages,
  createBeverage,
  updateBeverage,
  deleteBeverage,
  uploadBeverageImage,
} from '@/lib/api/beverages.api';
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
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

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

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing?.id) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get('name') as string)?.trim() ?? '';
    const price = Number(data.get('price')) || 0;
    const type = (data.get('type') as string) ?? editing.type;
    const containerType = (data.get('containerType') as ContainerType) ?? editing.containerType;
    const containerSize = (data.get('containerSize') as string)?.trim() ?? '';

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
    };

    setSaving(true);
    setError(null);
    try {
      if (editImageFile) {
        const { imageUrl } = await uploadBeverageImage(editImageFile);
        dto.imageUrl = imageUrl;
      }
      await updateBeverage(editing.id, dto);
      setEditing(null);
      setEditImageFile(null);
      setEditImagePreview(null);
      loadBeverages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Selecciona una imagen (JPEG, PNG, WebP o GIF).');
        return;
      }
      setEditImageFile(file);
      const url = URL.createObjectURL(file);
      setEditImagePreview(url);
      setError(null);
    } else {
      setEditImageFile(null);
      setEditImagePreview(null);
    }
    e.target.value = '';
  };

  const clearEditImage = () => {
    setEditImageFile(null);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview(null);
  };

  const handleDelete = (b: BeverageDto) => {
    if (
      !confirm(
        `¿Eliminar "${b.name}" (${b.containerSize || CONTAINER_TYPE_LABELS[b.containerType as ContainerType]})? No se mostrará en el catálogo.`,
      )
    )
      return;
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
      .finally(() => setDeletingId(null));
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const dto: CreateBeverageDto = {
      name: (form.querySelector('[name="new-name"]') as HTMLInputElement)?.value?.trim() ?? '',
      price: Number((form.querySelector('[name="new-price"]') as HTMLInputElement)?.value) || 0,
      type: (form.querySelector('[name="new-type"]') as HTMLSelectElement)?.value ?? 'ALCOHOLICA',
      containerType: (form.querySelector('[name="new-containerType"]') as HTMLSelectElement)?.value as ContainerType,
      containerSize: (form.querySelector('[name="new-containerSize"]') as HTMLInputElement)?.value?.trim() || '',
    };
    if (!dto.name || dto.price < 1 || !dto.containerType) {
      setError('Nombre, precio y envase son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      if (createImageFile) {
        const { imageUrl } = await uploadBeverageImage(createImageFile);
        dto.imageUrl = imageUrl;
      }
      await createBeverage(dto);
      setShowCreate(false);
      setCreateImageFile(null);
      setCreateImagePreview(null);
      loadBeverages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear bebida.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Selecciona una imagen (JPEG, PNG, WebP o GIF).');
        return;
      }
      setCreateImageFile(file);
      const url = URL.createObjectURL(file);
      setCreateImagePreview(url);
      setError(null);
    } else {
      setCreateImageFile(null);
      setCreateImagePreview(null);
    }
    e.target.value = '';
  };

  const clearCreateImage = () => {
    setCreateImageFile(null);
    if (createImagePreview) URL.revokeObjectURL(createImagePreview);
    setCreateImagePreview(null);
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

      {/* Modal crear — Portal para centrar en viewport tras scroll */}
      {showCreate &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] overflow-y-auto"
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
                <span className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Imagen (opcional)
                </span>
                <div className="flex items-center gap-3">
                  <input
                    id="new-imageFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleCreateImageChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('new-imageFile')?.click()}
                    disabled={saving}
                  >
                    {createImageFile ? 'Cambiar imagen' : 'Subir presentación'}
                  </Button>
                  {createImagePreview && (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- preview usa blob URL */}
                      <img
                        src={createImagePreview}
                        alt="Vista previa"
                        className="h-12 w-12 object-cover rounded border border-[var(--border)]"
                      />
                      <button
                        type="button"
                        onClick={clearCreateImage}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                        aria-label="Quitar imagen"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  JPEG, PNG, WebP o GIF. Máx. 2 MB.
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
                    clearCreateImage();
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

      {/* Modal editar — Portal para centrar en viewport tras scroll */}
      {editing &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] overflow-y-auto"
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
                <span className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Imagen
                </span>
                <div className="flex items-center gap-3">
                  <input
                    id="edit-imageFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleEditImageChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('edit-imageFile')?.click()}
                    disabled={saving}
                  >
                    {editImageFile ? 'Cambiar imagen' : 'Subir presentación'}
                  </Button>
                  {(editImagePreview || editing.imageUrl) && (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- preview usa blob URL o ruta dinámica */}
                      <img
                        src={editImagePreview || editing.imageUrl || ''}
                        alt="Vista previa"
                        className="h-12 w-12 object-cover rounded border border-[var(--border)]"
                      />
                      {editImageFile && (
                        <button
                          type="button"
                          onClick={clearEditImage}
                          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                          aria-label="Quitar imagen nueva"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  JPEG, PNG, WebP o GIF. Máx. 2 MB. Si no subes una nueva, se mantiene la actual.
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
                    clearEditImage();
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
