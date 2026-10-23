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
] as const;

export function parseTheme(value: string | undefined) {
  return THEMES.some((t) => t.value === value) ? value! : "system";
}

export function parseAccent(value: string | undefined) {
  return ACCENTS.some((a) => a.value === value) ? value! : "kek";
}
