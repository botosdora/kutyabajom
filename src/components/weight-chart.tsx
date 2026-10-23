"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, ChartTooltip } from "@/components/chart-parts";

export type WeightPoint = { date: string; label: string; kg: number };

const kg = (v: number) => `${v.toLocaleString("hu-HU", { maximumFractionDigits: 2 })} kg`;

export function WeightChart({ data, height = 200 }: { data: WeightPoint[]; height?: number }) {
  if (data.length < 2) {
    return <p className="py-6 text-center text-sm text-text-muted">A diagramhoz legalább két mérés kell.</p>;
  }
  return (
    <div style={{ height }} role="img" aria-label="Súly változása diagram">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v.toLocaleString("hu-HU", { maximumFractionDigits: 1 })}
            width={44}
          />
          <Tooltip content={<ChartTooltip format={kg} />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="kg"
            name="Súly"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#weightFill)"
            dot={{ r: 4, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
