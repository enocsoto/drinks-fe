'use client';

import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser } from '@/lib/api/users.api';
import type { UserDto, CreateUserDto, UserRole } from '@/types/user.types';
import { AdminGuard } from '../_components/admin-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '../_components/table-skeleton';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'SELLER', label: 'Vendedor' },
  { value: 'ADMIN', label: 'Administrador' },
];

function roleDisplay(role: UserDto['role']): string {
  if (Array.isArray(role)) return role[0] === 'ADMIN' ? 'Administrador' : 'Vendedor';
  return role === 'ADMIN' ? 'Administrador' : 'Vendedor';
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true); // true para carga inicial; el effect solo setea false en callbacks
  const [includeInactive, setIncludeInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<UserDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    getUsers({ includeInactive })
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    // Mostrar loading al cambiar filtro; setState en callback async para cumplir react-hooks/set-state-in-effect
    getUsers({ includeInactive })
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [includeInactive]);

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const dto: CreateUserDto = {
      name: (form.querySelector('[name="name"]') as HTMLInputElement)?.value?.trim() ?? '',
      document: Number((form.querySelector('[name="document"]') as HTMLInputElement)?.value) || 0,
      password: (form.querySelector('[name="password"]') as HTMLInputElement)?.value ?? '',
      role: ((form.querySelector('[name="role"]') as HTMLSelectElement)?.value as UserRole) || 'SELLER',
    };
    if (!dto.name || dto.document < 1 || !dto.password || dto.password.length < 6) {
      setError('Nombre, documento y contraseña (mín. 6 caracteres) son obligatorios.');
      return;
    }
    setSaving(true);
    createUser(dto)
      .then(() => {
        setShowCreate(false);
        loadUsers();
      })
      .catch((err) => setError(err?.message ?? 'Error al crear usuario.'))
      .finally(() => setSaving(false));
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    const form = e.currentTarget;
    const name = (form.querySelector('[name="edit-name"]') as HTMLInputElement)?.value?.trim();
    const documentVal = Number((form.querySelector('[name="edit-document"]') as HTMLInputElement)?.value);
    const password = (form.querySelector('[name="edit-password"]') as HTMLInputElement)?.value;
    const payload: { name?: string; document?: number; password?: string } = {};
    if (name) payload.name = name;
    if (documentVal >= 1) payload.document = documentVal;
    if (password && password.length >= 6) payload.password = password;
    if (Object.keys(payload).length === 0 && !editing) return;
    setSaving(true);
    updateUser(editing.id, payload)
      .then(() => {
        setEditing(null);
        loadUsers();
      })
      .catch((err) => setError(err?.message ?? 'Error al actualizar.'))
      .finally(() => setSaving(false));
  };

  const handleDeactivate = (u: UserDto) => {
    if (!confirm(`¿Desactivar a ${u.name}? No podrá iniciar sesión.`)) return;
    setDeactivatingId(u.id);
    updateUser(u.id, { isActive: false })
      .then(() => loadUsers())
      .catch((err) => setError(err?.message ?? 'Error al desactivar.'))
      .finally(() => setDeactivatingId(null));
  };

  const handleReactivate = (u: UserDto) => {
    setDeactivatingId(u.id);
    updateUser(u.id, { isActive: true })
      .then(() => loadUsers())
      .catch((err) => setError(err?.message ?? 'Error al reactivar.'))
      .finally(() => setDeactivatingId(null));
  };

  return (
    <AdminGuard>
      <div className="min-w-0 space-y-6 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Usuarios</h1>
            <p className="mt-0.5 break-words text-sm text-[var(--text-muted)]">
              Crear, editar y desactivar usuarios. Solo administradores.
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-[var(--border)]"
              />
              Incluir desactivados
            </label>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                setShowCreate(true);
                setError(null);
              }}
            >
              Crear usuario
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="glass rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Lista de usuarios</h2>
          </div>
          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">
              No hay usuarios. Crea el primero con el botón «Crear usuario».
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-zebra w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Nombre</th>
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Documento</th>
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Rol</th>
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Estado</th>
                    <th className="w-[7.75rem] min-w-[7.75rem] px-3 py-3 text-center text-xs font-semibold text-[var(--text-secondary)]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface)]/50 ${!u.isActive ? 'opacity-70' : ''}`}
                    >
                      <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{u.name}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">{u.document}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">{roleDisplay(u.role)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={
                            u.isActive ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                          }
                        >
                          {u.isActive ? 'Activo' : 'Desactivado'}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(u);
                              setError(null);
                            }}
                            title="Editar"
                            aria-label={`Editar ${u.name}`}
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
                          {u.isActive ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(u)}
                              disabled={deactivatingId === u.id}
                              title="Desactivar"
                              aria-label={`Desactivar ${u.name}`}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-600 transition-colors hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 disabled:opacity-50 dark:text-amber-400"
                            >
                              {deactivatingId === u.id ? (
                                <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <svg
                                  className="h-5 w-5 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  aria-hidden
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="9"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    fill="none"
                                  />
                                  <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeWidth={2}
                                    d="M9 12h6"
                                  />
                                </svg>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReactivate(u)}
                              disabled={deactivatingId === u.id}
                              title="Reactivar"
                              aria-label={`Reactivar ${u.name}`}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50 dark:text-emerald-400"
                            >
                              {deactivatingId === u.id ? (
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
                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              )}
                            </button>
                          )}
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
          aria-labelledby="create-user-title"
        >
          <div className="glass rounded-xl border border-[var(--border)] w-full max-w-md shadow-lg">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h2 id="create-user-title" className="text-lg font-semibold text-[var(--text-primary)]">
                Crear usuario
              </h2>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Nombre
                </label>
                <Input id="name" name="name" required placeholder="Ej. Juan Pérez" className="w-full" />
              </div>
              <div>
                <label htmlFor="document" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Documento
                </label>
                <Input
                  id="document"
                  name="document"
                  type="number"
                  min={1}
                  required
                  placeholder="Ej. 1234567890"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Contraseña (mín. 6 caracteres, letra y número)
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={6}
                  required
                  placeholder="••••••••"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="SELLER"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
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
          aria-labelledby="edit-user-title"
        >
          <div className="glass rounded-xl border border-[var(--border)] w-full max-w-md shadow-lg">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h2 id="edit-user-title" className="text-lg font-semibold text-[var(--text-primary)]">
                Editar usuario
              </h2>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Nombre
                </label>
                <Input id="edit-name" name="edit-name" defaultValue={editing.name} required className="w-full" />
              </div>
              <div>
                <label
                  htmlFor="edit-document"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Documento
                </label>
                <Input
                  id="edit-document"
                  name="edit-document"
                  type="number"
                  min={1}
                  defaultValue={editing.document}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-password"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Nueva contraseña (opcional; dejar en blanco para no cambiar)
                </label>
                <Input
                  id="edit-password"
                  name="edit-password"
                  type="password"
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full"
                />
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
