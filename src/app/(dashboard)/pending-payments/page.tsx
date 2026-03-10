'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  getPendingPayments,
  createPendingPayment,
  updatePendingPayment,
  deletePendingPayment,
  openPendingPaymentPdf,
} from '@/lib/api/pending-payments.api';
import type { PendingPaymentDto, CreatePendingPaymentDto } from '@/types/pending-payment.types';
import { DrinkType, DRINK_TYPE_LABELS } from '@/types/beverage.types';
import { formatCOP, formatDate } from '@/lib/utils';
import { AuthGuard } from '../_components/auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '../_components/table-skeleton';

const DRINK_TYPE_OPTIONS = Object.values(DrinkType).map((value) => ({
  value,
  label: DRINK_TYPE_LABELS[value] ?? value,
}));

function summaryTags(item: PendingPaymentDto): string[] {
  const tags: string[] = [];
  if (item.drinkTypes?.length) {
    tags.push(...item.drinkTypes.map((t) => DRINK_TYPE_LABELS[t] ?? t));
  }
  if (item.hasGloves) tags.push('Guantes');
  if (item.hasPendingGames) tags.push('Juegos');
  return tags;
}

export default function PendingPaymentsPage() {
  const [data, setData] = useState<{
    data: PendingPaymentDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debtDateFrom, setDebtDateFrom] = useState('');
  const [debtDateTo, setDebtDateTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PendingPaymentDto | null>(null);
  const [payingItem, setPayingItem] = useState<PendingPaymentDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const limit = 10;

  const load = useCallback(() => {
    setLoading(true);
    getPendingPayments({
      page,
      limit,
      search: search.trim() || undefined,
      debtDateFrom: debtDateFrom || undefined,
      debtDateTo: debtDateTo || undefined,
    })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, search, debtDateFrom, debtDateTo]);

  useEffect(() => {
    let cancelled = false;
    getPendingPayments({
      page,
      limit,
      search: search.trim() || undefined,
      debtDateFrom: debtDateFrom || undefined,
      debtDateTo: debtDateTo || undefined,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, debtDateFrom, debtDateTo]);

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const personName = (form.querySelector('[name="personName"]') as HTMLInputElement)?.value?.trim() ?? '';
    const nickname = (form.querySelector('[name="nickname"]') as HTMLInputElement)?.value?.trim() ?? '';
    const debtDate = (form.querySelector('[name="debtDate"]') as HTMLInputElement)?.value ?? '';
    const amount = Number((form.querySelector('[name="amount"]') as HTMLInputElement)?.value) || 0;
    const description = (form.querySelector('[name="description"]') as HTMLTextAreaElement)?.value?.trim() ?? '';
    const hasGloves = (form.querySelector('[name="hasGloves"]') as HTMLInputElement)?.checked ?? false;
    const hasPendingGames = (form.querySelector('[name="hasPendingGames"]') as HTMLInputElement)?.checked ?? false;
    const drinkTypes: string[] = [];
    form.querySelectorAll<HTMLInputElement>('input[name="drinkTypes"]:checked').forEach((cb) => {
      if (cb.value) drinkTypes.push(cb.value);
    });

    if (!personName || !debtDate || amount < 0) {
      setError('Nombre, fecha y cantidad son obligatorios. La cantidad no puede ser negativa.');
      return;
    }

    const dto: CreatePendingPaymentDto = {
      personName,
      nickname: nickname || undefined,
      debtDate,
      amount,
      drinkTypes: drinkTypes.length ? (drinkTypes as CreatePendingPaymentDto['drinkTypes']) : undefined,
      hasGloves,
      hasPendingGames,
      description: description || undefined,
    };
    setSaving(true);
    createPendingPayment(dto)
      .then((created) => {
        setShowCreate(false);
        load();
        if (created?.id) {
          openPendingPaymentPdf(created.id).catch(() => {
            // PDF opcional; no bloquear si falla
          });
        }
      })
      .catch((err) => setError(err?.message ?? 'Error al crear.'))
      .finally(() => setSaving(false));
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    const form = e.currentTarget;
    const personName = (form.querySelector('[name="edit-personName"]') as HTMLInputElement)?.value?.trim();
    const nickname = (form.querySelector('[name="edit-nickname"]') as HTMLInputElement)?.value?.trim() ?? '';
    const debtDate = (form.querySelector('[name="edit-debtDate"]') as HTMLInputElement)?.value;
    const amount = Number((form.querySelector('[name="edit-amount"]') as HTMLInputElement)?.value);
    const description = (form.querySelector('[name="edit-description"]') as HTMLTextAreaElement)?.value?.trim() ?? '';
    const hasGloves = (form.querySelector('[name="edit-hasGloves"]') as HTMLInputElement)?.checked ?? false;
    const hasPendingGames = (form.querySelector('[name="edit-hasPendingGames"]') as HTMLInputElement)?.checked ?? false;
    const drinkTypes: string[] = [];
    form.querySelectorAll<HTMLInputElement>('input[name="edit-drinkTypes"]:checked').forEach((cb) => {
      if (cb.value) drinkTypes.push(cb.value);
    });

    setSaving(true);
    updatePendingPayment(editing.id, {
      personName: personName ?? editing.personName,
      nickname,
      debtDate: debtDate ?? editing.debtDate,
      amount: Number.isFinite(amount) ? amount : editing.amount,
      drinkTypes: drinkTypes as PendingPaymentDto['drinkTypes'],
      hasGloves,
      hasPendingGames,
      description,
    })
      .then(() => {
        setEditing(null);
        load();
      })
      .catch((err) => setError(err?.message ?? 'Error al actualizar.'))
      .finally(() => setSaving(false));
  };

  const handlePayAbono = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payingItem) return;
    setError(null);
    const form = e.currentTarget;
    const abonoInput = (form.querySelector('[name="abonoAmount"]') as HTMLInputElement)?.value;
    const abono = Math.max(0, Number(abonoInput) || 0);
    const currentPaid = payingItem.amountPaid ?? 0;
    const newAmountPaid = Math.min(payingItem.amount, currentPaid + abono);

    setSaving(true);
    updatePendingPayment(payingItem.id, { amountPaid: newAmountPaid })
      .then(() => {
        setPayingItem(null);
        load();
      })
      .catch((err) => setError(err?.message ?? 'Error al registrar abono.'))
      .finally(() => setSaving(false));
  };

  const handlePayComplete = () => {
    if (!payingItem) return;
    setError(null);
    setSaving(true);
    updatePendingPayment(payingItem.id, { amountPaid: payingItem.amount })
      .then(() => {
        setPayingItem(null);
        load();
      })
      .catch((err) => setError(err?.message ?? 'Error al registrar pago completo.'))
      .finally(() => setSaving(false));
  };

  const handleDelete = (item: PendingPaymentDto) => {
    if (!confirm(`¿Eliminar el registro de "${item.personName}" (${formatCOP(item.amount)})?`)) return;
    setDeletingId(item.id);
    deletePendingPayment(item.id)
      .then(() => load())
      .catch((err) => setError(err?.message ?? 'Error al eliminar.'))
      .finally(() => setDeletingId(null));
  };

  return (
    <AuthGuard>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Pagos pendientes</h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">
              Personas con saldos por cobrar: nombre, apodo, fecha, cantidad, tipos (bebidas, guantes, juegos) y
              descripción.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowCreate(true);
              setError(null);
            }}
          >
            Registrar pago pendiente
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Buscar</label>
            <Input
              type="search"
              placeholder="Nombre, apodo o descripción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Fecha desde</label>
            <Input
              type="date"
              value={debtDateFrom}
              onChange={(e) => setDebtDateFrom(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Fecha hasta</label>
            <Input type="date" value={debtDateTo} onChange={(e) => setDebtDateTo(e.target.value)} className="w-full" />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPage(1)}>
            Filtrar
          </Button>
        </div>

        <div className="glass rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Listado</h2>
          </div>
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : !data?.data?.length ? (
            <div className="p-8 text-center text-[var(--text-muted)]">
              No hay registros. Usa «Registrar pago pendiente» para agregar uno.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                      <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Nombre</th>
                      <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Apodo</th>
                      <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Fecha</th>
                      <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3">Cantidad</th>
                      <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3">Tipos</th>
                      <th className="text-left font-semibold text-[var(--text-secondary)] px-5 py-3 max-w-[200px]">
                        Descripción
                      </th>
                      <th className="text-right font-semibold text-[var(--text-secondary)] px-5 py-3 w-32">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface)]/50"
                      >
                        <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{item.personName}</td>
                        <td className="px-5 py-3 text-[var(--text-secondary)]">{item.nickname || '—'}</td>
                        <td className="px-5 py-3 text-[var(--text-secondary)]">{formatDate(item.debtDate)}</td>
                        <td className="px-5 py-3 text-right font-medium text-[var(--text-primary)]">
                          {formatCOP(item.amount)}
                          {(item.amountPaid ?? 0) > 0 && (
                            <span className="block text-xs text-[var(--text-muted)]">
                              Pagado: {formatCOP(item.amountPaid ?? 0)} — Saldo: {formatCOP(Math.max(0, item.amount - (item.amountPaid ?? 0)))}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[var(--text-secondary)]">
                          {summaryTags(item).length ? summaryTags(item).join(', ') : '—'}
                        </td>
                        <td
                          className="px-5 py-3 text-[var(--text-secondary)] max-w-[200px] truncate"
                          title={item.description || undefined}
                        >
                          {item.description || '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openPendingPaymentPdf(item.id)}
                              aria-label={`Imprimir comanda de ${item.personName}`}
                            >
                              Imprimir
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPayingItem(item);
                                setError(null);
                              }}
                              aria-label={`Registrar abono de ${item.personName}`}
                            >
                              Abonar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditing(item);
                                setError(null);
                              }}
                              aria-label={`Editar ${item.personName}`}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                              {deletingId === item.id ? '...' : 'Eliminar'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.totalPages > 1 && (
                <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--text-muted)]">
                  <span>
                    Página {data.page} de {data.totalPages} ({data.total} registros)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal crear */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-pending-title"
        >
          <div className="glass rounded-xl border border-[var(--border)] w-full max-w-lg shadow-lg my-8">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h2 id="create-pending-title" className="text-lg font-semibold text-[var(--text-primary)]">
                Registrar pago pendiente
              </h2>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="personName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Nombre *
                  </label>
                  <Input id="personName" name="personName" required placeholder="Ej. Juan Pérez" className="w-full" />
                </div>
                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Apodo
                  </label>
                  <Input id="nickname" name="nickname" placeholder="Ej. Juancho" className="w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="debtDate" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Fecha en que queda debiendo *
                  </label>
                  <Input id="debtDate" name="debtDate" type="date" required className="w-full" />
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Cantidad (COP) *
                  </label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min={0}
                    step={100}
                    required
                    placeholder="0"
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Tipos de bebida (opcional, varios)
                </span>
                <div className="flex flex-wrap gap-3">
                  {DRINK_TYPE_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        name="drinkTypes"
                        value={value}
                        className="rounded border-[var(--border)]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="hasGloves" className="rounded border-[var(--border)]" />
                  Guantes pendientes
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="hasPendingGames" className="rounded border-[var(--border)]" />
                  Juegos pendientes
                </label>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Notas adicionales"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Registrar'}
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

      {/* Modal editar — Portal para centrar en viewport tras scroll */}
      {editing &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-pending-title"
          >
            <div className="glass rounded-xl border border-[var(--border)] w-full max-w-lg shadow-lg my-8">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h2 id="edit-pending-title" className="text-lg font-semibold text-[var(--text-primary)]">
                Editar pago pendiente
              </h2>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-personName"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                  >
                    Nombre *
                  </label>
                  <Input
                    id="edit-personName"
                    name="edit-personName"
                    defaultValue={editing.personName}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-nickname"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                  >
                    Apodo
                  </label>
                  <Input id="edit-nickname" name="edit-nickname" defaultValue={editing.nickname} className="w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-debtDate"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                  >
                    Fecha en que queda debiendo *
                  </label>
                  <Input
                    id="edit-debtDate"
                    name="edit-debtDate"
                    type="date"
                    defaultValue={editing.debtDate}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-amount"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                  >
                    Cantidad (COP) *
                  </label>
                  <Input
                    id="edit-amount"
                    name="edit-amount"
                    type="number"
                    min={0}
                    step={100}
                    defaultValue={editing.amount}
                    required
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Tipos de bebida (opcional, varios)
                </span>
                <div className="flex flex-wrap gap-3">
                  {DRINK_TYPE_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        name="edit-drinkTypes"
                        value={value}
                        defaultChecked={editing.drinkTypes?.includes(value)}
                        className="rounded border-[var(--border)]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="edit-hasGloves"
                    defaultChecked={editing.hasGloves}
                    className="rounded border-[var(--border)]"
                  />
                  Guantes pendientes
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="edit-hasPendingGames"
                    defaultChecked={editing.hasPendingGames}
                    className="rounded border-[var(--border)]"
                  />
                  Juegos pendientes
                </label>
              </div>
              <div>
                <label
                  htmlFor="edit-description"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Descripción
                </label>
                <textarea
                  id="edit-description"
                  name="edit-description"
                  rows={3}
                  defaultValue={editing.description}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
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
        </div>,
          document.body,
        )}

      {/* Modal registrar abono / pago completo — Portal para centrar en viewport tras scroll */}
      {payingItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-modal-title"
          >
            <div className="glass rounded-xl border border-[var(--border)] w-full max-w-sm shadow-lg my-8">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h2 id="pay-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                Registrar pago — {payingItem.personName}
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Total: {formatCOP(payingItem.amount)} — Pagado: {formatCOP(payingItem.amountPaid ?? 0)} — Saldo: {formatCOP(Math.max(0, payingItem.amount - (payingItem.amountPaid ?? 0)))}
              </p>
            </div>
            <form onSubmit={handlePayAbono} className="p-5 space-y-4">
              <div>
                <label htmlFor="abonoAmount" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Monto del abono (COP)
                </label>
                <Input
                  id="abonoAmount"
                  name="abonoAmount"
                  type="number"
                  min={0}
                  step={100}
                  placeholder="0"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Registrar abono'}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handlePayComplete}
                  disabled={saving || (payingItem.amountPaid ?? 0) >= payingItem.amount}
                >
                  Pagar completo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPayingItem(null);
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
    </AuthGuard>
  );
}
