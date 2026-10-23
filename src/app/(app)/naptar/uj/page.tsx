import { EventForm } from "@/components/event-form";
import { PageHeader } from "@/components/ui";
import { VET_TYPES } from "@/lib/calendar";
import { todayIso } from "@/lib/format";
import { getVets, vetOptions } from "@/lib/health";
import { requireCurrentPet } from "@/lib/pets";
import { getTaskTypeOptions } from "@/lib/task-types";
import { createEvent } from "../actions";

export const metadata = { title: "Új esemény" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ nap?: string; fajta?: string }> }) {
  const pet = await requireCurrentPet();
  const { nap, fajta } = await searchParams;
  const [vets, taskTypes] = await Promise.all([getVets(pet.id), getTaskTypeOptions(pet.id)]);

  return (
    <>
      <PageHeader title="Új esemény" subtitle={pet.name} back={{ href: "/naptar", label: "Naptár" }} />
      <EventForm
        action={createEvent}
        petId={pet.id}
        vetTypes={VET_TYPES}
        taskTypes={taskTypes}
        vets={vetOptions(vets)}
        defaultDate={nap && /^\d{4}-\d{2}-\d{2}$/.test(nap) ? nap : todayIso()}
        defaultCategory={fajta === "feladat" ? "feladat" : "orvosi"}
      />
    </>
  );
}
