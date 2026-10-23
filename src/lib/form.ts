// Üres mezőkből null lesz, hogy az adatbázisba ne kerüljön üres szöveg.
export function optional(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function required(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function optionalNumber(formData: FormData, key: string) {
  const value = optional(formData, key);
  if (value === null) return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
