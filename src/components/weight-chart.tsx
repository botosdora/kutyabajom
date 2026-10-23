"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type WeightPoint = { date: string; label: string; kg: number };

export function WeightChart({ data, height = 200 }: { data: WeightPoint[]; height?: number }) {
  if (data.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-text-muted">
        A diagramhoz legalább két mérés kell.
      </p>
    );
  }
  return (
    <div style={{ height }} role="img" aria-label="Súly változása diagram">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={24}
          />
          <YAxis
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v.toLocaleString("hu-HU", { maximumFractionDigits: 1 })}
            width={48}
          />
          <Tooltip
            formatter={(v) => [`${Number(v).toLocaleString("hu-HU")} kg`, "Súly"]}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 13,
            }}
            labelStyle={{ color: "var(--text-muted)" }}
          />
          <Line
            type="monotone"
            dataKey="kg"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--primary)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
