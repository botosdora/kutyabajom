import { MedicationForm } from "@/components/medication-form";
import { PageHeader } from "@/components/ui";
import { todayIso } from "@/lib/format";
import { requireCurrentPet } from "@/lib/pets";
import { createMedication } from "../actions";

export const metadata = { title: "Új gyógyszer" };

export default async function NewMedicationPage() {
  const pet = await requireCurrentPet();
  return (
    <>
      <PageHeader title="Új gyógyszer" subtitle={pet.name} back={{ href: "/gyogyszerek", label: "Gyógyszerek" }} />
      <MedicationForm action={createMedication} petId={pet.id} today={todayIso()} />
    </>
  );
}
