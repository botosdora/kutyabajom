export const VET_TYPES = [
  { value: "vizsgalat", label: "Vizsgálat" },
  { value: "oltas", label: "Oltás" },
  { value: "vervetel", label: "Vérvétel" },
  { value: "kontroll", label: "Kontroll" },
  { value: "egyeb", label: "Egyéb" },
];

export function vetTypeLabel(value: string | null) {
  return VET_TYPES.find((t) => t.value === value)?.label ?? "Orvosi";
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  planned: "Tervezett",
  done: "Megtörtént",
  missed: "Elmaradt",
};

// Hány nappal előre jelezzük a dashboardon (a brief szerint).
export const REMIND_DAYS = { orvosi: 5, feladat: 1, reorder: 7 };

// Orvosi naptár-esemény típusa → orvosi beavatkozás típusa (medical_events.kind).
export function medicalKindFor(vetType: string | null) {
  return vetType === "egyeb" ? "egyeb" : "vizsgalat";
}
