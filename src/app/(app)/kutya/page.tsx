import { ActionForm, DeleteButton, SubmitButton } from "@/components/forms";
import { PetFields } from "@/components/pet-fields";
import { Card, Field, PageHeader, SectionTitle, TextArea } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentPet, requireUser } from "@/lib/pets";
import { addMember, deletePet, removeMember, updatePet } from "../actions";

export const metadata = { title: "Kutya adatai" };

export default async function PetSettingsPage() {
  const [pet, user] = await Promise.all([requireCurrentPet(), requireUser()]);
  const supabase = await createClient();
  const { data: members } = await supabase.rpc("pet_member_list", { p_pet_id: pet.id });
  const isOwner = members?.some((m) => m.user_id === user.id && m.role === "owner") ?? false;

  return (
    <>
      <PageHeader title={`${pet.name} adatai`} back={{ href: "/egeszseg", label: "Egészség" }} />

      <Card className="mb-6">
        <ActionForm action={updatePet}>
          <input type="hidden" name="pet_id" value={pet.id} />
          <PetFields pet={pet} />
          <TextArea label="Megjegyzés" name="notes" defaultValue={pet.notes ?? ""} />
          <SubmitButton>Mentés</SubmitButton>
        </ActionForm>
      </Card>

      <section className="mb-6">
        <SectionTitle>Gazdák</SectionTitle>
        <p className="mb-3 text-sm text-text-muted">
          A társgazdák mindent látnak és szerkeszthetnek ennél a kutyánál.
        </p>
        <ul className="mb-3 divide-y divide-border rounded-2xl border border-border bg-surface">
          {members?.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="font-medium">
                  {m.full_name || m.email}
                  {m.user_id === user.id && <span className="text-text-muted"> (te)</span>}
                </p>
                <p className="text-xs text-text-muted">{m.role === "owner" ? "Tulajdonos" : "Társgazda"}</p>
              </div>
              {(isOwner || m.user_id === user.id) && m.role !== "owner" && (
                <DeleteButton
                  action={removeMember.bind(null, pet.id, m.user_id)}
                  label={m.user_id === user.id ? "Kilépés" : "Eltávolítás"}
                  confirmText="Biztosan eltávolítod?"
                />
              )}
            </li>
          ))}
        </ul>
        <Card>
          <ActionForm action={addMember}>
            <input type="hidden" name="pet_id" value={pet.id} />
            <Field
              label="Társgazda e-mail címe"
              name="email"
              type="email"
              hint="Az illetőnek előbb regisztrálnia kell a Kutyabajomba."
              required
            />
            <SubmitButton variant="secondary">Hozzáadás</SubmitButton>
          </ActionForm>
        </Card>
      </section>

      {isOwner && (
        <section>
          <SectionTitle>Veszélyzóna</SectionTitle>
          <DeleteButton
            action={deletePet.bind(null, pet.id)}
            label={`${pet.name} és minden adatának törlése`}
            confirmText={`Biztosan törlöd ${pet.name} összes adatát? Ez nem vonható vissza.`}
          />
        </section>
      )}
    </>
  );
}
