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

export const REPEAT_RULES = [
  { value: "", label: "Nem ismétlődik" },
  { value: "daily", label: "Naponta" },
  { value: "weekly", label: "Hetente" },
  { value: "monthly", label: "Havonta" },
  { value: "yearly", label: "Évente" },
];

const MAX_OCCURRENCES = 200;

// Egy ismétlődő sorozat dátumai a kezdéstől az utolsó napig (legfeljebb 200 alkalom).
export function repeatDates(start: string, rule: string, interval: number, until: string) {
  const dates: string[] = [];
  const [y, m, d] = start.split("-").map(Number);
  for (let i = 0; dates.length < MAX_OCCURRENCES; i++) {
    const step = i * interval;
    let date: Date;
    if (rule === "daily") date = new Date(Date.UTC(y, m - 1, d + step));
    else if (rule === "weekly") date = new Date(Date.UTC(y, m - 1, d + step * 7));
    else {
      const months = rule === "yearly" ? step * 12 : step;
      const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
      date = new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay)));
    }
    const iso = date.toISOString().slice(0, 10);
    if (iso > until) break;
    dates.push(iso);
  }
  return dates;
}

export function describeRepeat(rule: string | null, interval: number | null) {
  if (!rule) return null;
  const n = interval ?? 1;
  const unit = { daily: "nap", weekly: "hét", monthly: "hónap", yearly: "év" }[rule] ?? "";
  return n === 1 ? REPEAT_RULES.find((r) => r.value === rule)?.label : `${n} ${unit}enként`.replace("hétenként", "hetente");
}
