// Gyakori kutyás laborparaméterek tájékoztató referenciatartománnyal. A pontos
// tartomány laboronként eltér, ezért a felvitelnél átírható (a leletről).
export const LAB_PRESETS = [
  { name: "ALT (GPT)", unit: "U/l", low: 10, high: 125 },
  { name: "ALKP", unit: "U/l", low: 23, high: 212 },
  { name: "GGT", unit: "U/l", low: 0, high: 11 },
  { name: "Összbilirubin", unit: "µmol/l", low: 0, high: 15 },
  { name: "Karbamid (BUN)", unit: "mmol/l", low: 2.5, high: 9.6 },
  { name: "Kreatinin", unit: "µmol/l", low: 44, high: 159 },
  { name: "SDMA", unit: "µg/dl", low: 0, high: 14 },
  { name: "Glükóz", unit: "mmol/l", low: 4.1, high: 7.9 },
  { name: "Összfehérje", unit: "g/l", low: 52, high: 82 },
  { name: "Albumin", unit: "g/l", low: 23, high: 40 },
  { name: "Koleszterin", unit: "mmol/l", low: 2.8, high: 8.3 },
  { name: "T4", unit: "nmol/l", low: 13, high: 51 },
  { name: "Hematokrit", unit: "%", low: 37, high: 55 },
  { name: "Hemoglobin", unit: "g/l", low: 131, high: 205 },
  { name: "Vörösvérsejt (RBC)", unit: "T/l", low: 5.5, high: 8.5 },
  { name: "Fehérvérsejt (WBC)", unit: "G/l", low: 5.5, high: 16.9 },
  { name: "Thrombocyta", unit: "G/l", low: 175, high: 500 },
];

export type LabStatus = "low" | "normal" | "high" | "unknown";

export function labStatus(value: number, low: number | null, high: number | null): LabStatus {
  if (low === null && high === null) return "unknown";
  if (low !== null && value < low) return "low";
  if (high !== null && value > high) return "high";
  return "normal";
}

export const LAB_STATUS_STYLE: Record<LabStatus, { label: string; badge: string }> = {
  low: { label: "Alacsony", badge: "bg-warning-soft text-warning" },
  normal: { label: "Normál", badge: "bg-success-soft text-success" },
  high: { label: "Magas", badge: "bg-danger-soft text-danger" },
  unknown: { label: "Nincs tartomány", badge: "bg-surface-muted text-text-muted" },
};

export function formatLabValue(value: number, unit: string | null) {
  return `${Number(value).toLocaleString("hu-HU", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
}

export function formatRange(low: number | null, high: number | null, unit: string | null) {
  if (low === null && high === null) return null;
  const f = (n: number) => Number(n).toLocaleString("hu-HU");
  return `${low !== null ? f(low) : "…"} – ${high !== null ? f(high) : "…"}${unit ? ` ${unit}` : ""}`;
}
