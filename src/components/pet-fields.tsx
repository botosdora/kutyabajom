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
      {pet && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Reggeli ideje" name="breakfast_time" type="time" defaultValue={pet.breakfast_time.slice(0, 5)} required />
          <Field label="Vacsora ideje" name="dinner_time" type="time" defaultValue={pet.dinner_time.slice(0, 5)} required />
        </div>
      )}
    </>
  );
}
