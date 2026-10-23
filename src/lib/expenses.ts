// Minden kategóriának saját, állandó diagramszíne van (validált paletta, rögzített sorrend).
export const EXPENSE_CATEGORIES = [
  { value: "allatorvos", label: "Állatorvos", color: "var(--series-1)" },
  { value: "gyogyszer", label: "Gyógyszer", color: "var(--series-2)" },
  { value: "etel", label: "Étel", color: "var(--series-3)" },
  { value: "apolas", label: "Ápolás, kozmetika", color: "var(--series-4)" },
  { value: "terapia", label: "Terápia, sport", color: "var(--series-5)" },
  { value: "felszereles", label: "Felszerelés", color: "var(--series-6)" },
  { value: "egyeb", label: "Egyéb", color: "var(--series-7)" },
];

export function expenseCategoryLabel(value: string) {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
