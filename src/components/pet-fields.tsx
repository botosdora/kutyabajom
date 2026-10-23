import { Field, Select } from "@/components/ui";
import type { Tables } from "@/lib/database.types";

export function PetFields({ pet }: { pet?: Tables<"pets"> }) {
  return (
    <>
      <Field label="Név" name="name" defaultValue={pet?.name} required />
      <Field label="Fajta" name="breed" defaultValue={pet?.breed ?? ""} />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Nem"
          name="sex"
          defaultValue={pet?.sex ?? ""}
          options={[
            { value: "", label: "–" },
            { value: "kan", label: "Kan" },
            { value: "szuka", label: "Szuka" },
          ]}
        />
        <Field label="Születési dátum" name="birth_date" type="date" defaultValue={pet?.birth_date ?? ""} />
      </div>
      <Field label="Chipszám" name="chip_number" inputMode="numeric" defaultValue={pet?.chip_number ?? ""} />
    </>
  );
}
