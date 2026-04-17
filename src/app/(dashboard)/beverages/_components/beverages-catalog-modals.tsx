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
  showCreate: boolean;
  editing: BeverageDto | null;
  setShowCreate: (v: boolean) => void;
  setEditing: (v: BeverageDto | null) => void;
  saving: boolean;
  setError: (v: string | null) => void;
  createImageFile: File | null;
  createImagePreview: string | null;
  editImageFile: File | null;
  editImagePreview: string | null;
  onCreateSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  onEditSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  onCreateImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearCreateImage: () => void;
  clearEditImage: () => void;
};

export function BeveragesCatalogModals({
  showCreate,
  editing,
  setShowCreate,
  setEditing,
  saving,
  setError,
  createImageFile,
  createImagePreview,
  editImageFile,
  editImagePreview,
  onCreateSubmit,
  onEditSubmit,
  onCreateImageChange,
  onEditImageChange,
  clearCreateImage,
  clearEditImage,
}: Props) {
  return (
    <>
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
                  <span className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Imagen (opcional)</span>
                  <div className="flex items-center gap-3">
                    <input
                      id="new-imageFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={onCreateImageChange}
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
                  <p className="text-xs text-[var(--text-muted)] mt-1">JPEG, PNG, WebP o GIF. Máx. 2 MB.</p>
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
              <form key={editing.id} onSubmit={onEditSubmit} className="p-5 space-y-4">
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
                  <span className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Imagen</span>
                  <div className="flex items-center gap-3">
                    <input
                      id="edit-imageFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={onEditImageChange}
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
    </>
  );
}
