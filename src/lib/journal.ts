// "good": a magasabb a jobb; "pain": a magasabb a rosszabb; "neutral": csak mennyiség.
export const SCALES = [
  { key: "mood", label: "Kedv, hangulat", short: "Kedv", low: "rossz", high: "kiváló", kind: "good" },
  { key: "appetite", label: "Étvágy", short: "Étvágy", low: "nem evett", high: "kiváló", kind: "good" },
  { key: "activity", label: "Mozgás", short: "Mozgás", low: "nem mozgott", high: "nagyon aktív", kind: "good" },
  { key: "pain", label: "Fájdalom", short: "Fájdalom", low: "nincs", high: "erős", kind: "pain" },
  { key: "water", label: "Folyadékfogyasztás", short: "Ivás", low: "nem ivott", high: "nagyon sokat", kind: "neutral" },
] as const;

export type ScaleKey = (typeof SCALES)[number]["key"];
export type ScaleKind = (typeof SCALES)[number]["kind"];
export type Tone = "good" | "warn" | "bad" | "neutral";

// Szöveges értékelés és állapot egy 0–10-es értékhez (nem csak színnel jelezzük).
export function rateScale(kind: ScaleKind, value: number): { word: string; tone: Tone } {
  if (kind === "pain") {
    if (value === 0) return { word: "Nincs", tone: "good" };
    if (value <= 3) return { word: "Enyhe", tone: "good" };
    if (value <= 6) return { word: "Közepes", tone: "warn" };
    if (value <= 8) return { word: "Erős", tone: "bad" };
    return { word: "Nagyon erős", tone: "bad" };
  }
  if (kind === "neutral") {
    const words = ["Nagyon kevés", "Nagyon kevés", "Nagyon kevés", "Kevés", "Kevés", "Átlagos", "Átlagos", "Sok", "Sok", "Nagyon sok", "Nagyon sok"];
    return { word: words[value], tone: "neutral" };
  }
  if (value <= 2) return { word: "Rossz", tone: "bad" };
  if (value <= 4) return { word: "Gyenge", tone: "warn" };
  if (value <= 6) return { word: "Közepes", tone: "warn" };
  if (value <= 8) return { word: "Jó", tone: "good" };
  return { word: "Kiváló", tone: "good" };
}

export const TONE_STYLE: Record<Tone, { fill: string; badge: string }> = {
  good: { fill: "var(--success)", badge: "bg-success-soft text-success" },
  warn: { fill: "var(--warning)", badge: "bg-warning-soft text-warning" },
  bad: { fill: "var(--danger)", badge: "bg-danger-soft text-danger" },
  neutral: { fill: "var(--primary)", badge: "bg-primary-soft text-link" },
};

export const STOOL_OPTIONS = [
  { value: "normalis", label: "Normális" },
  { value: "lagy", label: "Lágy" },
  { value: "hasmenes", label: "Hasmenés" },
  { value: "szekrekedes", label: "Székrekedés" },
  { value: "nem_volt", label: "Nem volt széklet" },
];

export const OBSERVATIONS = [
  { value: "hanyas", label: "Hányás" },
  { value: "kohoges", label: "Köhögés / nehézlégzés" },
  { value: "viszketes", label: "Viszketés" },
  { value: "santitas", label: "Sántítás" },
  { value: "szokatlan_viselkedes", label: "Szokatlan viselkedés" },
  { value: "semmi_szokatlan", label: "Semmi szokatlan" },
];

export function stoolLabel(value: string | null) {
  return STOOL_OPTIONS.find((s) => s.value === value)?.label ?? null;
}

export function observationLabel(value: string) {
  return OBSERVATIONS.find((o) => o.value === value)?.label ?? value;
}

// Átlag egy tizedesre, ha van adat.
export function average(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
