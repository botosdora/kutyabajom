"use client";

// Közös diagram-elemek: egységes, kártyás tooltip a téma színeivel.
type TooltipEntry = { name?: string | number; value?: number | string | null; color?: string; dataKey?: string | number };

export function ChartTooltip({
  active,
  payload,
  label,
  format = (v) => String(v),
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  format?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!rows.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      {label !== undefined && <p className="mb-1 text-xs font-medium text-text-muted">{label}</p>}
      {rows.map((p) => (
        <p key={String(p.dataKey ?? p.name)} className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden="true" />
          <span className="text-text-muted">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums">{format(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
}

export const axisTick = { fontSize: 11, fill: "var(--text-muted)" };
