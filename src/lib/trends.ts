import { formatShortDate } from "@/lib/format";
import type { TrendSeries } from "@/components/trend-chart";

// Színek a skálákhoz; világos és sötét témában is jól elkülönülnek.
export const TREND_SERIES: TrendSeries[] = [
  { key: "mood", label: "Kedv", color: "#7c5cd6" },
  { key: "appetite", label: "Étvágy", color: "#2f8f5b" },
  { key: "activity", label: "Mozgás", color: "#2f6fd6" },
  { key: "pain", label: "Fájdalom", color: "#d9622b" },
];

export function trendData(logs: { day: string; mood: number | null; appetite: number | null; activity: number | null; pain: number | null }[]) {
  return [...logs]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((l) => ({ label: formatShortDate(l.day), mood: l.mood, appetite: l.appetite, activity: l.activity, pain: l.pain }));
}
