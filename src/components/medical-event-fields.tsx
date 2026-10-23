import { Field, Select, TextArea } from "@/components/ui";
import type { Tables } from "@/lib/database.types";

export function MedicalEventFields({
  event,
  kinds,
  vets,
  today,
}: {
  event?: Tables<"medical_events">;
  kinds: { value: string; label: string }[];
  vets: { value: string; label: string }[];
  today: string;
}) {
  return (
    <>
      <Field label="Megnevezés" name="title" defaultValue={event?.title} placeholder="pl. Ivartalanítás" required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dátum" name="event_date" type="date" defaultValue={event?.event_date ?? today} required />
        <Select label="Típus" name="kind" defaultValue={event?.kind ?? "vizsgalat"} options={kinds} />
      </div>
      <Select label="Orvos" name="vet_id" defaultValue={event?.vet_id ?? ""} options={vets} />
      <TextArea
        label="Részletek"
        name="description"
        rows={5}
        defaultValue={event?.description ?? ""}
        placeholder="Mi történt, mit javasolt az orvos, gyógyulás menete…"
      />
    </>
  );
}
