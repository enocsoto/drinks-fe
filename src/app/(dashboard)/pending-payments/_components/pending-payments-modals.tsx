'use client';

import { createPortal } from 'react-dom';
import type { PendingPaymentDto } from '@/types/pending-payment.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCOP } from '@/lib/utils';
import { PENDING_DRINK_TYPE_OPTIONS } from '../_utils/pending-payments-display';

type Props = {
  showCreate: boolean;
  setShowCreate: (v: boolean) => void;
  editing: PendingPaymentDto | null;
  setEditing: (v: PendingPaymentDto | null) => void;
  payingItem: PendingPaymentDto | null;
  setPayingItem: (v: PendingPaymentDto | null) => void;
  saving: boolean;
  setError: (v: string | null) => void;
  onCreateSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onEditSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onPayAbono: (e: React.FormEvent<HTMLFormElement>) => void;
  onPayComplete: () => void;
};

export function PendingPaymentsModals({
  showCreate,
  setShowCreate,
  editing,
  setEditing,
  payingItem,
  setPayingItem,
  saving,
  setError,
  onCreateSubmit,
  onEditSubmit,
  onPayAbono,
  onPayComplete,
}: Props) {
  return (
    <>
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
            <form onSubmit={onCreateSubmit} className="p-5 space-y-4">
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
                  {PENDING_DRINK_TYPE_OPTIONS.map(({ value, label }) => (
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
              <form onSubmit={onEditSubmit} className="p-5 space-y-4">
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
                    {PENDING_DRINK_TYPE_OPTIONS.map(({ value, label }) => (
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
                  Total: {formatCOP(payingItem.amount)} — Pagado: {formatCOP(payingItem.amountPaid ?? 0)} — Saldo:{' '}
                  {formatCOP(Math.max(0, payingItem.amount - (payingItem.amountPaid ?? 0)))}
                </p>
              </div>
              <form onSubmit={onPayAbono} className="p-5 space-y-4">
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
                    onClick={onPayComplete}
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
    </>
  );
}
