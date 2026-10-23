"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/chart-parts";

export type CostSlice = { key: string; label: string; value: number; color: string };

const huf = (v: number) => `${v.toLocaleString("hu-HU")} Ft`;

// Költségek kategóriánként: fánkdiagram a végösszeggel középen, mellette a lista.
export function CostDonut({ slices, total }: { slices: CostSlice[]; total: number }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative size-48 shrink-0" role="img" aria-label="Költségek megoszlása kategóriánként">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="64%"
              outerRadius="100%"
              paddingAngle={slices.length > 1 ? 2 : 0}
              cornerRadius={4}
              stroke="var(--surface)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip format={huf} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-text-muted">összesen</span>
          <span className="text-lg font-bold">{huf(total)}</span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-2">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center gap-2.5 text-sm">
            <span className="size-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden="true" />
            <span className="flex-1 font-medium">{s.label}</span>
            <span className="text-xs text-text-muted">{Math.round((s.value / total) * 100)}%</span>
            <span className="w-24 text-right font-semibold tabular-nums">{huf(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
