export const SCALES = [
  { key: "mood", label: "Kedv, hangulat", low: "rossz", high: "kiváló", inverted: false },
  { key: "appetite", label: "Étvágy", low: "nem evett", high: "kiváló", inverted: false },
  { key: "activity", label: "Mozgás", low: "nem mozgott", high: "nagyon aktív", inverted: false },
  { key: "pain", label: "Fájdalom", low: "nincs", high: "erős", inverted: true },
  { key: "water", label: "Folyadékfogyasztás", low: "nem ivott", high: "nagyon sokat", inverted: false },
] as const;

export type ScaleKey = (typeof SCALES)[number]["key"];

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
