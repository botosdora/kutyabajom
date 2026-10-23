import { ActionForm, SubmitButton } from "@/components/forms";
import { PetFields } from "@/components/pet-fields";
import { Field, PageHeader } from "@/components/ui";
import { getPets } from "@/lib/pets";
import { createPet } from "../../actions";

export const metadata = { title: "Új kutya" };

export default async function NewPetPage() {
  const pets = await getPets();
  return (
    <>
      <PageHeader
        title={pets.length ? "Új kutya" : "Kezdjük a kutyáddal!"}
        subtitle={pets.length ? undefined : "Üdv a Kutyabajomban"}
      />
      <ActionForm action={createPet}>
        <PetFields />
        <Field label="Jelenlegi súly (kg)" name="weight_kg" inputMode="decimal" placeholder="pl. 24,3" />
        <SubmitButton>Mentés</SubmitButton>
      </ActionForm>
    </>
  );
}
