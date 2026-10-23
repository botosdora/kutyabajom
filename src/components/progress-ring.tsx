// Napi haladás körként, mellette a "3 / 8" számláló.
export function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  const complete = total > 0 && done === total;
  return (
    <span className="flex items-center gap-2" aria-label={`${done} / ${total} teendő kész`}>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" className="-rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--surface-muted)" strokeWidth="4" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={complete ? "var(--success)" : "var(--primary)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className={`text-sm font-semibold tabular-nums ${complete ? "text-success" : "text-text-muted"}`}>
        {done} / {total}
      </span>
    </span>
  );
}
