// Megjelenési beállítások (téma, kiemelőszín). Sütiben tároljuk, eszközönként.
export const THEME_COOKIE = "tema";
export const ACCENT_COOKIE = "szin";

export const THEMES = [
  { value: "system", label: "Rendszer" },
  { value: "light", label: "Világos" },
  { value: "dark", label: "Sötét" },
] as const;

export const ACCENTS = [
  { value: "kek", label: "Kék", swatch: "#3346c9" },
  { value: "zsalya", label: "Zsálya", swatch: "#3f6b4f" },
  { value: "barack", label: "Barack", swatch: "#b4532a" },
  { value: "lila", label: "Lila", swatch: "#6b3fc9" },
  { value: "rozsa", label: "Rózsa", swatch: "#b8336a" },
  { value: "turkiz", label: "Türkiz", swatch: "#0f766e" },
  { value: "ocean", label: "Óceán", swatch: "#0369a1" },
  { value: "arany", label: "Arany", swatch: "#a16207" },
  { value: "bordo", label: "Bordó", swatch: "#9f1239" },
  { value: "grafit", label: "Grafit", swatch: "#475569" },
] as const;

export function parseTheme(value: string | undefined) {
  return THEMES.some((t) => t.value === value) ? value! : "system";
}

export function parseAccent(value: string | undefined) {
  return ACCENTS.some((a) => a.value === value) ? value! : "kek";
}
