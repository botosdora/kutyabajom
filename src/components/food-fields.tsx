import { Field, Select, TextArea } from "@/components/ui";
import { FOOD_KINDS } from "@/lib/foods";
import type { Tables } from "@/lib/database.types";

export function FoodFields({ food }: { food?: Tables<"foods"> }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Fajta" name="kind" defaultValue={food?.kind ?? "tap"} options={FOOD_KINDS} />
        <Field label="Típus" name="food_type" defaultValue={food?.food_type ?? ""} placeholder="pl. száraz, nedves" />
      </div>
      <Field label="Megnevezés" name="name" defaultValue={food?.name} placeholder="pl. Royal Canin Gastro Intestinal" required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Napi adag (g)" name="daily_grams" type="number" min={0} step="any" inputMode="decimal" defaultValue={food?.daily_grams ?? ""} />
        <Field label="Újrarendelés" name="reorder_on" type="date" defaultValue={food?.reorder_on ?? ""} />
      </div>
      <TextArea label="Megjegyzés" name="notes" defaultValue={food?.notes ?? ""} />
    </>
  );
}
