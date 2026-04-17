'use client';

import { useEffect, useState } from 'react';
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
import { TableSkeleton } from '../_components/table-skeleton';
import { BeveragesCatalogModals } from './_components/beverages-catalog-modals';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

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
                    <th className="w-[7.75rem] min-w-[7.75rem] px-3 py-3 text-center text-xs font-semibold text-[var(--text-secondary)]">
                      Acciones
                    </th>
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
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdate(b)}
                            title="Editar"
                            aria-label={`Editar ${b.name}`}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/50 text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                          >
                            <svg
                              className="h-5 w-5 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b)}
                            disabled={deletingId === b.id}
                            title="Eliminar"
                            aria-label={`Eliminar ${b.name}`}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/35 bg-red-500/10 text-red-600 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 disabled:opacity-50 dark:text-red-400"
                          >
                            {deletingId === b.id ? (
                              <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <svg
                                className="h-5 w-5 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                aria-hidden
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
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

      <BeveragesCatalogModals
        showCreate={showCreate}
        editing={editing}
        setShowCreate={setShowCreate}
        setEditing={setEditing}
        saving={saving}
        setError={setError}
        createImageFile={createImageFile}
        createImagePreview={createImagePreview}
        editImageFile={editImageFile}
        editImagePreview={editImagePreview}
        onCreateSubmit={handleCreateSubmit}
        onEditSubmit={handleEditSubmit}
        onCreateImageChange={handleCreateImageChange}
        onEditImageChange={handleEditImageChange}
        clearCreateImage={clearCreateImage}
        clearEditImage={clearEditImage}
      />
    </AdminGuard>
  );
}
