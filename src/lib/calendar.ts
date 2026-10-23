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

export const CALENDAR_FILTER_COOKIE = "naptar_szuro";

// A naptár rétegei; a színek a validált paletta rögzített helyei.
export const CALENDAR_LAYERS = [
  { key: "orvosi", label: "Orvosi", color: "var(--series-1)" },
  { key: "feladat", label: "Feladatok", color: "var(--series-2)" },
  { key: "gyogyszer", label: "Gyógyszerek", color: "var(--series-3)" },
] as const;

export function parseCalendarFilter(value: string | undefined) {
  return new Set((value ?? "orvosi,feladat").split(","));
}
