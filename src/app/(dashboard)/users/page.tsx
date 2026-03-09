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
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Usuarios</h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">
              Crear, editar y desactivar usuarios. Solo administradores.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Nombre</th>
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Documento</th>
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Rol</th>
                    <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Estado</th>
                    <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3 w-48">Acciones</th>
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
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(u);
                              setError(null);
                            }}
                            aria-label={`Editar ${u.name}`}
                          >
                            Editar
                          </Button>
                          {u.isActive ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivate(u)}
                              disabled={deactivatingId === u.id}
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                            >
                              {deactivatingId === u.id ? '...' : 'Desactivar'}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivate(u)}
                              disabled={deactivatingId === u.id}
                            >
                              {deactivatingId === u.id ? '...' : 'Reactivar'}
                            </Button>
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
