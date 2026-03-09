'use client';

export function BeverageGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-lg border border-[var(--border)] overflow-hidden min-w-0">
          <div className="h-24 bg-[var(--border)] shrink-0" />
          <div className="p-2 flex flex-col gap-1.5">
            <div className="h-3 w-3/4 rounded bg-[var(--border)]" />
            <div className="h-2.5 w-1/2 rounded bg-[var(--border)]" />
            <div className="h-3 w-1/3 rounded bg-[var(--border)] mt-0.5" />
            <div className="flex items-center gap-1 mt-1">
              <div className="w-7 h-7 rounded bg-[var(--border)] shrink-0" />
              <div className="h-3 flex-1 max-w-[1.25rem] rounded bg-[var(--border)] mx-auto" />
              <div className="w-7 h-7 rounded bg-[var(--border)] shrink-0" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
