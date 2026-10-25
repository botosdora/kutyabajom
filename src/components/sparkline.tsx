// Apró trendvonal egy szám mellé (tengely és felirat nélkül): csak az irányt
// mutatja. A hiányzó napokat kihagyja, az utolsó pontot kiemeli.
export function Sparkline({
  values,
  color,
  width = 96,
  height = 32,
  min,
  max,
  label,
}: {
  values: (number | null)[];
  color: string;
  width?: number;
  height?: number;
  min?: number;
  max?: number;
  label?: string;
}) {
  const points = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
  if (points.length < 2) return null;
  const lo = min ?? Math.min(...points.map((p) => p.v));
  const hi = max ?? Math.max(...points.map((p) => p.v));
  const pad = 4;
  const x = (i: number) => pad + (i / Math.max(1, values.length - 1)) * (width - pad * 2);
  const y = (v: number) => (hi === lo ? height / 2 : pad + (1 - (v - lo) / (hi - lo)) * (height - pad * 2));
  const d = points.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="shrink-0 overflow-visible"
    >
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last.i)} cy={y(last.v)} r={3.5} fill={color} stroke="var(--surface)" strokeWidth={2} />
    </svg>
  );
}
