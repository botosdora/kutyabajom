"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, ChartTooltip } from "@/components/chart-parts";

export type TrendPoint = { label: string } & Record<string, number | null | string>;
export type TrendSeries = { key: string; label: string; color: string };

// Több 0–10-es skála időben. A jelmagyarázat gombjaival a sorozatok ki-be kapcsolhatók;
// a színek a sorozathoz tartoznak, kikapcsoláskor a többi nem színeződik át.
export function TrendChart({ data, series, height = 240 }: { data: TrendPoint[]; series: TrendSeries[]; height?: number }) {
  const [hidden, setHidden] = useState<string[]>([]);
  if (data.length < 2) {
    return <p className="py-6 text-center text-sm text-text-muted">A diagramhoz legalább két naplóbejegyzés kell.</p>;
  }
  const visible = series.filter((s) => !hidden.includes(s.key));

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Megjelenített értékek">
        {series.map((s) => {
          const on = !hidden.includes(s.key);
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={on}
              onClick={() => setHidden(on ? [...hidden, s.key] : hidden.filter((k) => k !== s.key))}
              className={`flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${
                on ? "border-border-strong bg-surface text-text" : "border-transparent bg-surface-muted text-text-muted line-through"
              }`}
            >
              <span className="size-2.5 rounded-full" style={{ background: on ? s.color : "var(--border-strong)" }} aria-hidden="true" />
              {s.label}
            </button>
          );
        })}
      </div>
      <div style={{ height }} role="img" aria-label={`${visible.map((s) => s.label).join(", ")} változása`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={axisTick} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "4 4" }} />
            {visible.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={data.length <= 31 ? { r: 3, fill: s.color, stroke: "var(--surface)", strokeWidth: 1.5 } : false}
                activeDot={{ r: 5, fill: s.color, stroke: "var(--surface)", strokeWidth: 2 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
