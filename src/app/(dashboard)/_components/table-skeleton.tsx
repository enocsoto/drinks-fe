'use client';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 border-b border-[var(--border)] px-5 py-3 bg-[var(--bg-surface)]">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-[var(--border)] flex-1 min-w-0"
            style={{ maxWidth: i === cols - 1 ? '6rem' : undefined }}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-[var(--border)] last:border-0 px-5 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 rounded bg-[var(--border)] flex-1 min-w-0"
              style={{ width: c === 0 ? '30%' : undefined, maxWidth: c === cols - 1 ? '5rem' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
