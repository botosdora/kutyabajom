import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, EmptyState, Field, PageHeader, SectionTitle } from "@/components/ui";
import { requireCurrentPet } from "@/lib/pets";
import { updateMealTimes } from "../actions";

export const metadata = { title: "Étkezés" };

export default async function FeedingPage() {
  const pet = await requireCurrentPet();
  return (
    <>
      <PageHeader title="Étkezés" subtitle={pet.name} />

      <section className="mb-6">
        <SectionTitle>Etetési időpontok</SectionTitle>
        <Card>
          <ActionForm action={updateMealTimes}>
            <input type="hidden" name="pet_id" value={pet.id} />
            <p className="text-sm text-text-muted">A főoldalon ezekben az időpontokban jelenik meg a reggeli és a vacsora.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Reggeli" name="breakfast_time" type="time" defaultValue={pet.breakfast_time.slice(0, 5)} required />
              <Field label="Vacsora" name="dinner_time" type="time" defaultValue={pet.dinner_time.slice(0, 5)} required />
            </div>
            <SubmitButton>Mentés</SubmitButton>
          </ActionForm>
        </Card>
      </section>

      <section>
        <SectionTitle>Tápok és jutalomfalatok</SectionTitle>
        <EmptyState>A tápok, adagok, újrarendelések és a nem bevált tápok listája az 5. fázisban érkezik ide.</EmptyState>
      </section>
    </>
  );
}
