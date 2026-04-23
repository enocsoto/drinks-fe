'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';

import dayjs from 'dayjs';
import { formatDayColombia } from '@/lib/date-colombia';
import { cn } from '@/lib/utils';

function ymdToLocalDate(ymd: string | undefined): Date | undefined {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined;
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToYmd(d: Date): string {
  return dayjs(d).format('YYYY-MM-DD');
}

export type DateInputProps = {
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  'aria-label'?: string;
  /** Texto del botón vacío (sin fecha) */
  emptyLabel?: string;
};

const START = new Date(new Date().getFullYear() - 10, 0, 1);
const END = new Date(new Date().getFullYear() + 5, 11, 31);

export function DateInput({
  id,
  name,
  required,
  disabled,
  className,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onChange,
  'aria-label': ariaLabel,
  emptyLabel = 'Seleccionar fecha',
}: DateInputProps) {
  const isControlled = valueProp !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = (isControlled ? (valueProp ?? '') : uncontrolled) as string;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
      onChange?.({
        target: { value: next, name: name ?? '' },
        currentTarget: { value: next, name: name ?? '' },
      } as React.ChangeEvent<HTMLInputElement>);
    },
    [isControlled, name, onChange, onValueChange],
  );

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const hiddenId = useId();

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
  }, [open, updateCoords, value]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updateCoords();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = ymdToLocalDate(value);
  const showLabel = value ? formatDayColombia(value) : emptyLabel;

  const initialVisibleMonth = selected ?? new Date();

  const popover = open
    ? createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[200] min-w-[17.5rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-0 shadow-lg"
          style={{
            top: coords.top,
            left: Math.max(6, Math.min(coords.left, (typeof window !== 'undefined' ? window.innerWidth : 400) - 296)),
            width: Math.max(Math.min(coords.width, typeof window !== 'undefined' ? window.innerWidth - 12 : 400), 17.5 * 16),
            maxWidth: 'min(100vw - 12px, 320px)',
          }}
        >
          <DayPicker
            mode="single"
            required={false}
            selected={selected}
            onSelect={(d) => {
              setValue(d ? dateToYmd(d) : '');
              if (d) setOpen(false);
            }}
            locale={es}
            weekStartsOn={1}
            captionLayout="dropdown"
            startMonth={START}
            endMonth={END}
            defaultMonth={initialVisibleMonth}
            disabled={disabled}
            className="drinks-rdp !m-0 !p-1"
          />
          {!required && value ? (
            <div className="border-t border-[var(--border)] px-2 py-1.5">
              <button
                type="button"
                onClick={() => {
                  setValue('');
                  setOpen(false);
                }}
                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Quitar fecha
              </button>
            </div>
          ) : null}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative w-full min-w-0">
      {name ? <input type="hidden" name={name} value={value} id={id ? `${id}-value` : hiddenId} readOnly required={!!required} /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'date-input-trigger flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-base)] pl-3 pr-2 text-left text-sm text-[var(--text-primary)]',
          'ring-offset-[var(--bg-base)] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !value && 'text-[var(--text-muted)]',
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate font-normal tabular-nums">{showLabel}</span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
      </button>
      {popover}
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
