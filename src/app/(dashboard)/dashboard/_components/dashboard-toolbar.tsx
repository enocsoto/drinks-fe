'use client';

const PERIOD_OPTIONS = [
  { value: 0, label: 'Hoy' },
  { value: 1, label: 'Últimos 7 días' },
  { value: 2, label: 'Últimos 30 días' },
  { value: 3, label: 'Este año' },
] as const;

interface Props {
  periodTab: number;
  onPeriodTabChange: (index: number) => void;
  onExportPdf?: () => void;
}

export function DashboardToolbar({ periodTab, onPeriodTabChange, onExportPdf }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 shadow-sm sm:py-2 sm:pl-3 sm:pr-2">
          <span
            className="inline-flex shrink-0 items-center justify-center text-[var(--text-muted)]"
            aria-hidden
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </span>
          <select
            value={periodTab}
            onChange={(e) => onPeriodTabChange(Number(e.target.value))}
            className="min-w-0 max-w-[calc(100vw-6rem)] cursor-pointer rounded-md border-0 bg-transparent py-1 pl-0 pr-6 text-sm font-medium text-[var(--text-primary)] shadow-none outline-none ring-0 focus:ring-0 sm:max-w-none sm:pr-2"
            aria-label="Rango de fechas"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={onExportPdf}
        className="inline-flex w-full min-h-10 items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-on-brand)] shadow-md transition-opacity hover:opacity-90 sm:w-auto"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Exportar PDF
      </button>
    </div>
  );
}
