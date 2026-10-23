import { formatShortDate } from "@/lib/format";

// Súlymérések diagramhoz: időrendben, legfeljebb az utolsó `limit` darab.
export function weightSeries(weights: { measured_on: string; weight_kg: number }[], limit = 30) {
  return weights
    .slice(0, limit)
    .reverse()
    .map((w) => ({ date: w.measured_on, label: formatShortDate(w.measured_on), kg: Number(w.weight_kg) }));
}
