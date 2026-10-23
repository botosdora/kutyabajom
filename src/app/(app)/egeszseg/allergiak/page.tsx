import { Activity, ShieldAlert } from "lucide-react";
import { AddPanel, DeleteButton } from "@/components/forms";
import { EmptyState, Field, PageHeader, SectionTitle, TextArea } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { requireCurrentPet } from "@/lib/pets";
import { addAllergy, addCondition, deleteRecord, toggleCondition } from "../actions";

export const metadata = { title: "Allergiák és betegségek" };

const PATH = "/egeszseg/allergiak";

export default async function AllergiesPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const [{ data: allergies }, { data: conditions }] = await Promise.all([
    supabase.from("allergies").select("*").eq("pet_id", pet.id).order("name"),
    supabase
      .from("conditions")
      .select("*")
      .eq("pet_id", pet.id)
      .order("active", { ascending: false })
      .order("name"),
  ]);

  return (
    <>
      <PageHeader title="Allergiák és betegségek" subtitle={pet.name} back={{ href: "/egeszseg", label: "Egészség" }} icon={ShieldAlert} />

      <section className="mb-8">
        <SectionTitle icon={ShieldAlert}>Ismert allergiák</SectionTitle>
        {allergies?.length ? (
          <ul className="mb-3 divide-y divide-border rounded-2xl border border-border bg-surface">
            {allergies.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2 pl-4 pr-2">
                <div className="flex-1">
                  <p className="font-semibold">{a.name}</p>
                  {a.notes && <p className="text-sm text-text-muted">{a.notes}</p>}
                </div>
                <DeleteButton action={deleteRecord.bind(null, "allergies", a.id, PATH)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-3">
            <EmptyState>Nincs rögzített allergia.</EmptyState>
          </div>
        )}
        <AddPanel label="Új allergia" action={addAllergy}>
          <input type="hidden" name="pet_id" value={pet.id} />
          <Field label="Mire allergiás?" name="name" placeholder="pl. csirkehús, fűpollen" required />
          <TextArea label="Tünetek, megjegyzés" name="notes" />
        </AddPanel>
      </section>

      <section>
        <SectionTitle icon={Activity}>Ismert betegségek</SectionTitle>
        {conditions?.length ? (
          <ul className="mb-3 divide-y divide-border rounded-2xl border border-border bg-surface">
            {conditions.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2 pl-4 pr-2">
                <div className="flex-1">
                  <p className="font-semibold">
                    {c.name}
                    {!c.active && <span className="ml-2 text-xs font-medium text-text-muted">(elmúlt)</span>}
                  </p>
                  <p className="text-sm text-text-muted">
                    {c.diagnosed_on && `Diagnózis: ${formatDate(c.diagnosed_on)}`}
                    {c.diagnosed_on && c.notes && " · "}
                    {c.notes}
                  </p>
                </div>
                <form action={toggleCondition.bind(null, c.id, !c.active)}>
                  <button type="submit" className="h-9 rounded-lg bg-primary-soft px-3 text-sm font-medium text-link hover:opacity-80">
                    {c.active ? "Elmúlt" : "Aktív"}
                  </button>
                </form>
                <DeleteButton action={deleteRecord.bind(null, "conditions", c.id, PATH)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-3">
            <EmptyState>Nincs rögzített betegség.</EmptyState>
          </div>
        )}
        <AddPanel label="Új betegség" action={addCondition}>
          <input type="hidden" name="pet_id" value={pet.id} />
          <Field label="Betegség" name="name" required />
          <Field label="Diagnózis dátuma" name="diagnosed_on" type="date" />
          <TextArea label="Megjegyzés" name="notes" />
        </AddPanel>
      </section>
    </>
  );
}
