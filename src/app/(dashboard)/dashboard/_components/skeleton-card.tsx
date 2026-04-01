interface Props {
  rows?: number;
}

export function SkeletonCard({ rows = 3 }: Props) {
  return (
    <div className="dashboard-card p-5 flex flex-col gap-4 animate-pulse">
      <div className="h-4 w-32 bg-[var(--border)] rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 rounded bg-[var(--border)]" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}
