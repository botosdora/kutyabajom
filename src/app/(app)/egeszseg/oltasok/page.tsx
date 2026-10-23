import { AddPanel, DeleteButton } from "@/components/forms";
import { EmptyState, Field, PageHeader, Select, TextArea } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate, todayIso } from "@/lib/format";
import { getVets, vetOptions } from "@/lib/health";
import { requireCurrentPet } from "@/lib/pets";
import { addVaccination, deleteRecord } from "../actions";

export const metadata = { title: "Oltások" };

export default async function VaccinationsPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const [{ data: vaccinations }, vets] = await Promise.all([
    supabase
      .from("vaccinations")
      .select("*, vets(name)")
      .eq("pet_id", pet.id)
      .order("vaccinated_on", { ascending: false }),
    getVets(pet.id),
  ]);
  const today = todayIso();

  return (
    <>
      <PageHeader title="Oltások" subtitle={pet.name} back={{ href: "/egeszseg", label: "Egészség" }} />

      <div className="mb-6">
        <AddPanel label="Új oltás" action={addVaccination}>
          <input type="hidden" name="pet_id" value={pet.id} />
          <Field label="Oltás" name="vaccine" placeholder="pl. veszettség, kombinált" required />
          <Field label="Készítmény neve" name="product_name" placeholder="pl. Nobivac DHPPi" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Beadás napja" name="vaccinated_on" type="date" defaultValue={today} required />
            <Field label="Érvényes eddig" name="valid_until" type="date" />
          </div>
          <Select label="Orvos" name="vet_id" options={vetOptions(vets)} />
          <TextArea label="Megjegyzés" name="notes" />
        </AddPanel>
      </div>

      {!vaccinations?.length ? (
        <EmptyState>Még nincs rögzített oltás.</EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {vaccinations.map((v) => {
            const expired = v.valid_until !== null && v.valid_until < today;
            return (
              <li key={v.id} className="flex items-start gap-3 py-3 pl-4 pr-2">
                <div className="flex-1">
                  <p className="font-semibold">
                    {v.vaccine}
                    {v.product_name && <span className="font-normal text-text-muted"> · {v.product_name}</span>}
                  </p>
                  <p className="text-sm text-text-muted">
                    {formatDate(v.vaccinated_on)}
                    {v.vets?.name && ` · ${v.vets.name}`}
                  </p>
                  {v.valid_until && (
                    <p className={`text-sm font-medium ${expired ? "text-danger" : "text-success"}`}>
                      {expired ? "Lejárt" : "Érvényes"}: {formatDate(v.valid_until)}
                    </p>
                  )}
                  {v.notes && <p className="text-sm text-text-muted">{v.notes}</p>}
                </div>
                <DeleteButton action={deleteRecord.bind(null, "vaccinations", v.id, "/egeszseg/oltasok")} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
