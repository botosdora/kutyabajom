import { notFound } from "next/navigation";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/forms";
import { MedicalEventFields } from "@/components/medical-event-fields";
import { Card, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate, todayIso } from "@/lib/format";
import { EVENT_KINDS, eventKindLabel, getVets, vetOptions } from "@/lib/health";
import { deleteRecord, updateMedicalEvent } from "../../actions";

export default async function MedicalEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("medical_events")
    .select("*, vets(name, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!event) notFound();
  const vets = await getVets(event.pet_id);

  return (
    <>
      <PageHeader
        title={event.title}
        subtitle={`${formatDate(event.event_date)} · ${eventKindLabel(event.kind)}`}
        back={{ href: "/egeszseg/beavatkozasok", label: "Beavatkozások" }}
      />

      {(event.description || event.vets) && (
        <Card className="mb-6">
          {event.vets && (
            <p className="mb-2 text-sm">
              <span className="font-semibold">Orvos:</span> {event.vets.name}
              {event.vets.phone && (
                <a href={`tel:${event.vets.phone}`} className="ml-2 text-primary">
                  {event.vets.phone}
                </a>
              )}
            </p>
          )}
          {event.description && <p className="whitespace-pre-line">{event.description}</p>}
        </Card>
      )}

      <details className="mb-6 rounded-2xl border border-border bg-surface">
        <summary className="cursor-pointer px-4 py-3 font-semibold">Szerkesztés</summary>
        <div className="px-4 pb-4">
          <ActionForm action={updateMedicalEvent}>
            <input type="hidden" name="id" value={event.id} />
            <MedicalEventFields event={event} kinds={EVENT_KINDS} vets={vetOptions(vets)} today={todayIso()} />
            <SubmitButton>Mentés</SubmitButton>
          </ActionForm>
        </div>
      </details>

      <p className="mb-6 text-sm text-text-muted">
        A dokumentumok csatolása és a költségek a későbbi fázisokban érkeznek.
      </p>

      <DeleteButton
        action={deleteRecord.bind(null, "medical_events", event.id, `/egeszseg/beavatkozasok/${event.id}`)}
        label="Esemény törlése"
      />
    </>
  );
}
