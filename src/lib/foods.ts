export const FOOD_KINDS = [
  { value: "tap", label: "Táp" },
  { value: "jutalomfalat", label: "Jutalomfalat" },
];

export function foodKindLabel(value: string) {
  return FOOD_KINDS.find((k) => k.value === value)?.label ?? value;
}
