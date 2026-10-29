import { formatDate, formatShortDate, shortTime } from "@/lib/format";
import type { Tables } from "@/lib/database.types";

export type Medication = Tables<"medications">;
export type Period = Tables<"medication_periods">;
export type MedicationWithPeriods = Medication & { medication_periods: Period[] };

export const MED_CATEGORIES = [
  { value: "gyogyszer", label: "Gyógyszer" },
  { value: "feregtelenites", label: "Féreghajtás" },
  { value: "kiegeszito", label: "Kiegészítő" },
];

export function categoryLabel(value: string) {
  return MED_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const DOSE_STATUS_LABELS: Record<string, string> = {
  given: "Beadva",
  missed: "Nem kapta meg",
  refused: "Elutasította",
};

// Miért hagyta abba (az időszak lezárásakor választható).
export const STOP_REASONS = [
  { value: "kura_vege", label: "Kúra vége" },
  { value: "mellekhatas", label: "Mellékhatás" },
  { value: "nem_segitett", label: "Nem segített" },
  { value: "orvos", label: "Orvos javaslatára" },
  { value: "elfogyott", label: "Elfogyott" },
  { value: "egyeb", label: "Egyéb" },
];

export function stopReasonLabel(value: string | null) {
  return STOP_REASONS.find((r) => r.value === value)?.label ?? null;
}

// Időszakok a legkorábbitól a legkésőbbiig.
export function sortPeriods(periods: Period[]) {
  return [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export function periodState(p: Period, today: string): "upcoming" | "running" | "ended" {
  if (p.start_date > today) return "upcoming";
  if (p.end_date && p.end_date < today) return "ended";
  return "running";
}

// Még szedi-e: egyszerinél az aktív jelző dönt, egyébként van-e folyamatban lévő
// vagy jövőbeli időszaka.
export function isCurrent(med: Medication, periods: Period[], today: string) {
  if (!med.active) return false;
  if (med.schedule_type === "once") return true;
  return periods.some((p) => !p.end_date || p.end_date >= today);
}

// Egy időszak gyakorisága és időpontjai, pl. "Naponta, 08:00, 20:00".
export function describeRhythm(p: Period) {
  const times = p.times.map(shortTime).join(", ");
  const every = p.interval_days === 1 ? "Naponta" : `${p.interval_days} naponta`;
  return `${every}, ${times}`;
}

export function describeRange(p: Period) {
  if (p.end_date === p.start_date) return formatDate(p.start_date);
  return p.end_date ? `${formatDate(p.start_date)} – ${formatDate(p.end_date)}` : `${formatDate(p.start_date)} óta`;
}

// Rövid összefoglaló a listákhoz és a PDF-hez.
export function describeSchedule(med: Medication, periods: Period[], today: string) {
  const sorted = sortPeriods(periods);
  if (sorted.length === 0) return "Nincs ütemezés";
  if (med.schedule_type === "once") {
    const times = [...new Set(sorted.flatMap((p) => p.times.map(shortTime)))].join(", ");
    if (sorted.length === 1) return `Egyszer: ${formatDate(sorted[0].start_date)}, ${times}`;
    const shown = sorted.slice(-3).map((p) => formatShortDate(p.start_date)).join(", ");
    return `${sorted.length} alkalom: ${sorted.length > 3 ? "…, " : ""}${shown} · ${times}`;
  }
  const current = sorted.find((p) => periodState(p, today) === "running") ?? sorted.find((p) => periodState(p, today) === "upcoming");
  const p = current ?? sorted[sorted.length - 1];
  const range = p.end_date
    ? ` · ${formatShortDate(p.start_date)} – ${formatShortDate(p.end_date)}`
    : p.start_date > today
      ? ` · kezdés: ${formatShortDate(p.start_date)}`
      : "";
  return `${describeRhythm(p)}${range}`;
}

// A most érvényes adag (az időszakban megadott, különben a gyógyszeré).
export function currentDosage(med: Medication, periods: Period[], today: string) {
  return periods.find((p) => periodState(p, today) === "running")?.dosage ?? med.dosage;
}
