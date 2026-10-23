import { formatDate, shortTime } from "@/lib/format";
import type { Tables } from "@/lib/database.types";

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

// Emberi nyelvű leírás az ütemezésről, pl. "28 naponta, 08:00".
export function describeSchedule(m: Tables<"medications">) {
  const times = m.times.map(shortTime).join(", ");
  if (m.schedule_type === "once") return `Egyszer: ${formatDate(m.start_date)}, ${times}`;
  const every = !m.interval_days || m.interval_days === 1 ? "Naponta" : `${m.interval_days} naponta`;
  const range =
    m.schedule_type === "course" && m.end_date
      ? ` · ${formatDate(m.start_date)} – ${formatDate(m.end_date)}`
      : "";
  return `${every}, ${times}${range}`;
}
