import Link from "next/link";
import { notFound } from "next/navigation";
import { formatLabValue, LAB_STATUS_STYLE, labStatus } from "@/lib/labs";
import { DocumentList } from "@/components/document-list";
import { DocumentUpload } from "@/components/document-upload";
import { ActionForm, AddPanel, DeleteButton, SubmitButton } from "@/components/forms";
import { MedicalEventFields } from "@/components/medical-event-fields";
import { SheetLauncher } from "@/components/sheet";
import { Alert, Card, Field, PageHeader, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { DOC_TYPES } from "@/lib/documents";
import { expenseCategoryLabel } from "@/lib/expenses";
import { formatDate, formatHuf, todayIso } from "@/lib/format";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { EVENT_KINDS, eventKindLabel, getVets, vetOptions } from "@/lib/health";
import { addMedicalEventCost, deleteMedicalEventCost, deleteRecord, updateMedicalEvent } from "../../actions";

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
  const [vets, { data: docs }, { data: costs }, { data: labs }] = await Promise.all([
    getVets(event.pet_id),
    supabase.from("documents").select("*").eq("medical_event_id", id).order("document_date", { ascending: false }),
    supabase.from("expenses").select("id, amount_huf, category, spent_on, title").eq("medical_event_id", id).order("spent_on"),
    supabase.from("lab_results").select("*").eq("medical_event_id", id).order("parameter"),
  ]);

  return (
    <>
      <PageHeader
        title={event.title}
        subtitle={`${formatDate(event.event_date)} · ${eventKindLabel(event.kind)}`}
        back={{ href: "/egeszseg/beavatkozasok", label: "Beavatkozások" }}
        action={
          <SheetLauncher title="Beavatkozás szerkesztése">
            <ActionForm action={updateMedicalEvent}>
              <input type="hidden" name="id" value={event.id} />
              <MedicalEventFields event={event} kinds={EVENT_KINDS} vets={vetOptions(vets)} today={todayIso()} />
              <SubmitButton>Mentés</SubmitButton>
            </ActionForm>
            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <DeleteButton
                action={deleteRecord.bind(null, "medical_events", event.id, `/egeszseg/beavatkozasok/${event.id}`)}
                label="Esemény törlése"
              />
            </div>
          </SheetLauncher>
        }
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

      {!!labs?.length && (
        <section className="mb-6">
          <SectionTitle>Laborértékek</SectionTitle>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {labs.map((r) => {
              const status = labStatus(Number(r.value), r.ref_low, r.ref_high);
              return (
                <li key={r.id}>
                  <Link href={`/egeszseg/labor/${encodeURIComponent(r.parameter)}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-muted">
                    <span className="flex-1 font-medium">{r.parameter}</span>
                    <span className="font-semibold tabular-nums">{formatLabValue(Number(r.value), r.unit)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LAB_STATUS_STYLE[status].badge}`}>
                      {LAB_STATUS_STYLE[status].label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

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

      <section className="mb-6">
        <SectionTitle
          action={
            !!costs?.length && (
              <span className="text-sm text-text-muted">
                Összesen: {formatHuf(costs.reduce((sum, c) => sum + c.amount_huf, 0))}
              </span>
            )
          }
        >
          Költségek
        </SectionTitle>
        {!!costs?.length && (
          <ul className="mb-3 divide-y divide-border rounded-2xl border border-border bg-surface">
            {costs.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2 pl-4 pr-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.title}</span>
                  <span className="block text-xs text-text-muted">
                    {formatDate(c.spent_on)} · {expenseCategoryLabel(c.category)}
                  </span>
                </span>
                <span className="font-semibold">{formatHuf(c.amount_huf)}</span>
                <DeleteButton action={deleteMedicalEventCost.bind(null, c.id, event.id)} />
              </li>
            ))}
          </ul>
        )}
        <AddPanel label="Költség hozzáadása" action={addMedicalEventCost}>
          <input type="hidden" name="medical_event_id" value={event.id} />
          <input type="hidden" name="pet_id" value={event.pet_id} />
          <input type="hidden" name="event_title" value={event.title} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Összeg (Ft)" name="cost_huf" type="number" min={0} inputMode="numeric" required />
            <Field label="Dátum" name="spent_on" type="date" defaultValue={event.event_date} required />
          </div>
          <Field label="Megnevezés" name="title" placeholder={`Ha üres: ${event.title}`} />
        </AddPanel>
      </section>

    </>
  );
}
