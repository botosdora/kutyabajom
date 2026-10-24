export const DOC_TYPES = [
  { value: "labor", label: "Laboreredmény" },
  { value: "korlap", label: "Kórlap" },
  { value: "rontgen", label: "Röntgen" },
  { value: "ultrahang", label: "Ultrahang" },
  { value: "recept", label: "Recept" },
  { value: "egyeb", label: "Egyéb" },
];

export function docTypeLabel(value: string) {
  return DOC_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function parseTags(value: string | null) {
  return [...new Set((value ?? "").split(",").map((t) => t.trim()).filter(Boolean))];
}

export function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("hu-HU", { maximumFractionDigits: 1 })} MB`;
}
