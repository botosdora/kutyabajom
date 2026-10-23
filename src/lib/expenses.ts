export const EXPENSE_CATEGORIES = [
  { value: "allatorvos", label: "Állatorvos" },
  { value: "gyogyszer", label: "Gyógyszer" },
  { value: "etel", label: "Étel" },
  { value: "apolas", label: "Ápolás, kozmetika" },
  { value: "terapia", label: "Terápia, sport" },
  { value: "felszereles", label: "Felszerelés" },
  { value: "egyeb", label: "Egyéb" },
];

export function expenseCategoryLabel(value: string) {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
