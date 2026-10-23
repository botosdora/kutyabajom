import { formatShortDate } from "@/lib/format";
import type { TrendSeries } from "@/components/trend-chart";

// A validált kategóriás paletta első négy helye, rögzített sorrendben
// (színtévesztők számára is elkülönülnek, világos és sötét témában is).
export const TREND_SERIES: TrendSeries[] = [
  { key: "mood", label: "Kedv", color: "var(--series-1)" },
  { key: "pain", label: "Fájdalom", color: "var(--series-2)" },
  { key: "appetite", label: "Étvágy", color: "var(--series-3)" },
  { key: "activity", label: "Mozgás", color: "var(--series-4)" },
];

export function trendData(logs: { day: string; mood: number | null; appetite: number | null; activity: number | null; pain: number | null }[]) {
  return [...logs]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((l) => ({ label: formatShortDate(l.day), mood: l.mood, appetite: l.appetite, activity: l.activity, pain: l.pain }));
}
