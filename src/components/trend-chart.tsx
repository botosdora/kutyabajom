"use client";

import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TrendPoint = { label: string } & Record<string, number | null | string>;
export type TrendSeries = { key: string; label: string; color: string };

// Több 0–10-es skála időben (napló kimutatás).
export function TrendChart({ data, series, height = 240 }: { data: TrendPoint[]; series: TrendSeries[]; height?: number }) {
  if (data.length < 2) {
    return <p className="py-6 text-center text-sm text-text-muted">A diagramhoz legalább két naplóbejegyzés kell.</p>;
  }
  return (
    <div style={{ height }} role="img" aria-label={`${series.map((s) => s.label).join(", ")} változása`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} minTickGap={24} />
          <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }}
            labelStyle={{ color: "var(--text-muted)" }}
          />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: s.color }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
