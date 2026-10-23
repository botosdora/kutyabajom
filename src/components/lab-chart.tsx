"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, ChartTooltip } from "@/components/chart-parts";

// Egy laborparaméter időben; a zöldes sáv a (legutóbbi) referenciatartomány.
export function LabChart({
  data,
  unit,
  low,
  high,
  name,
}: {
  data: { label: string; value: number }[];
  unit: string | null;
  low: number | null;
  high: number | null;
  name: string;
}) {
  if (data.length < 2) {
    return <p className="py-6 text-center text-sm text-text-muted">A diagramhoz legalább két mérés kell.</p>;
  }
  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values, low ?? Infinity);
  const rawMax = Math.max(...values, high ?? -Infinity);
  // Kerek tengelyhatárok; pozitív értékeknél nem megyünk nulla alá.
  const step = 10 ** Math.floor(Math.log10(Math.max(rawMax - rawMin, 1)));
  const min = Math.max(rawMin >= 0 ? 0 : -Infinity, Math.floor((rawMin - step * 0.5) / step) * step);
  const max = Math.ceil((rawMax + step * 0.5) / step) * step;
  const fmt = (v: number) => `${v.toLocaleString("hu-HU", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;

  return (
    <div style={{ height: 220 }} role="img" aria-label={`${name} értékei időben`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          {(low !== null || high !== null) && (
            <ReferenceArea y1={low ?? min} y2={high ?? max} ifOverflow="hidden" fill="var(--success)" fillOpacity={0.1} stroke="none" />
          )}
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis domain={[min, max]} tickCount={5} allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={48}
            tickFormatter={(v: number) => v.toLocaleString("hu-HU", { maximumFractionDigits: 1 })} />
          <Tooltip content={<ChartTooltip format={fmt} />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "4 4" }} />
          <Line type="monotone" dataKey="value" name={name} stroke="var(--primary)" strokeWidth={2}
            dot={{ r: 4, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
