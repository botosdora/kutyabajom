import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { DocumentUpload } from "@/components/document-upload";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/forms";
import { MedicalEventFields } from "@/components/medical-event-fields";
import { Alert, Card, PageHeader, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { DOC_TYPES } from "@/lib/documents";
import { expenseCategoryLabel } from "@/lib/expenses";
import { formatDate, formatHuf, todayIso } from "@/lib/format";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { EVENT_KINDS, eventKindLabel, getVets, vetOptions } from "@/lib/health";
import { deleteRecord, updateMedicalEvent } from "../../actions";

export default async function MedicalEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ uj?: string }>;
}) {
  const { id } = await params;
  const { uj } = await searchParams;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("medical_events")
    .select("*, vets(name, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!event) notFound();
  const [vets, { data: docs }, { data: costs }] = await Promise.all([
    getVets(event.pet_id),
    supabase.from("documents").select("*").eq("medical_event_id", id).order("document_date", { ascending: false }),
    supabase.from("expenses").select("id, amount_huf, category, spent_on").eq("medical_event_id", id),
  ]);

  return (
    <>
      <PageHeader
        title={event.title}
        subtitle={`${formatDate(event.event_date)} · ${eventKindLabel(event.kind)}`}
        back={{ href: "/egeszseg/beavatkozasok", label: "Beavatkozások" }}
      />

      {uj && (
        <div className="mb-4">
          <Alert kind="success">Rögzítve. Ha van kórlap vagy lelet, csatold itt lent.</Alert>
        </div>
      )}

      {(event.description || event.vets) && (
        <Card className="mb-6">
          {event.vets && (
            <p className="mb-2 text-sm">
              <span className="font-semibold">Orvos:</span> {event.vets.name}
              {event.vets.phone && (
                <a href={`tel:${event.vets.phone}`} className="ml-2 text-link">
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

      <section className="mb-6">
        <SectionTitle>Dokumentumok</SectionTitle>
        {!!docs?.length && (
          <div className="mb-3">
            <DocumentList docs={docs} />
          </div>
        )}
        <DocumentUpload
          petId={event.pet_id}
          supabaseUrl={supabaseUrl}
          supabaseKey={supabaseKey}
          docTypes={DOC_TYPES}
          today={event.event_date}
          medicalEventId={event.id}
        />
      </section>

      {!!costs?.length && (
        <section className="mb-6">
          <SectionTitle>Költségek</SectionTitle>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {costs.map((c) => (
              <li key={c.id} className="flex justify-between px-4 py-2.5 text-sm">
                <span>
                  {formatDate(c.spent_on)} · {expenseCategoryLabel(c.category)}
                </span>
                <span className="font-semibold">{formatHuf(c.amount_huf)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DeleteButton
        action={deleteRecord.bind(null, "medical_events", event.id, `/egeszseg/beavatkozasok/${event.id}`)}
        label="Esemény törlése"
      />
    </>
  );
}
