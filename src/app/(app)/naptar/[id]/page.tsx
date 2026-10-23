import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/forms";
import { EventForm } from "@/components/event-form";
import { Alert, buttonClass, Card, Field, PageHeader, Select, TextArea } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { describeRepeat, EVENT_STATUS_LABELS, VET_TYPES, vetTypeLabel } from "@/lib/calendar";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";
import { formatDate, shortTime, todayIso } from "@/lib/format";
import { getVets, vetOptions } from "@/lib/health";
import { getTaskTypeOptions } from "@/lib/task-types";
import { completeEvent, deleteEvent, deleteSeriesFrom, reopenEvent, updateEvent } from "../actions";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("calendar_events")
    .select("*, vets(name, phone), task_types(name)")
    .eq("id", id)
    .maybeSingle();
  if (!event) notFound();

  const [vets, taskTypes] = await Promise.all([getVets(event.pet_id), getTaskTypeOptions(event.pet_id)]);
  const today = todayIso();
  const isVet = event.category === "orvosi";
  const typeLabel = isVet ? vetTypeLabel(event.vet_type) : (event.task_types?.name ?? "Feladat");
  const due = event.status === "planned" && event.event_date <= today;

  return (
    <>
      <PageHeader
        title={event.title}
        subtitle={`${formatDate(event.event_date)}${event.event_time ? `, ${shortTime(event.event_time)}` : ""} · ${typeLabel}`}
        back={{ href: `/naptar?nap=${event.event_date}`, label: "Naptár" }}
      />

      <Card className="mb-6 flex flex-col gap-2 text-[15px]">
        <p>
          <span className="font-semibold">Állapot:</span> {EVENT_STATUS_LABELS[event.status]}
          {event.completed_on && ` (${formatDate(event.completed_on)})`}
        </p>
        {event.vets && (
          <p>
            <span className="font-semibold">Orvos:</span> {event.vets.name}
            {event.vets.phone && (
              <a href={`tel:${event.vets.phone}`} className="ml-2 text-link">
                {event.vets.phone}
              </a>
            )}
          </p>
        )}
        {event.series_id && (
          <p>
            <span className="font-semibold">Ismétlődik:</span> {describeRepeat(event.repeat_rule, event.repeat_interval)}
          </p>
        )}
        {event.location && (
          <p>
            <span className="font-semibold">Helyszín:</span> {event.location}
          </p>
        )}
        {event.notes && <p className="whitespace-pre-line text-text-muted">{event.notes}</p>}
        {event.medical_event_id && (
          <Link href={`/egeszseg/beavatkozasok/${event.medical_event_id}`} className="font-medium text-link">
            Orvosi beavatkozás és dokumentumok →
          </Link>
        )}
        {event.vaccination_id && (
          <Link href="/egeszseg/oltasok" className="font-medium text-link">
            Megjelenik az oltások között →
          </Link>
        )}
      </Card>

      {event.status === "planned" && (
        <section className="mb-6 rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-1 text-lg font-bold">Megtörtént?</h2>
          {!due && (
            <div className="mb-3">
              <Alert>Az esemény még nem esedékes, de előre is rögzítheted.</Alert>
            </div>
          )}
          <ActionForm action={completeEvent}>
            <input type="hidden" name="id" value={event.id} />
            <input type="hidden" name="outcome" value="done" />
            <Field label="Mikor történt?" name="completed_on" type="date" defaultValue={event.event_date <= today ? event.event_date : today} required />
            {isVet && event.vet_type === "oltas" && (
              <>
                <Field label="Kapott oltóanyag neve" name="product_name" placeholder="pl. Nobivac Rabies" required />
                <Field label="Érvényes eddig" name="valid_until" type="date" />
              </>
            )}
            {isVet && (
              <TextArea
                label={event.vet_type === "oltas" ? "Megjegyzés" : "Eredmény, megjegyzés"}
                name="description"
                placeholder="Mit mondott az orvos, mi a következő lépés…"
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Költség (Ft)" name="cost_huf" type="number" min={0} inputMode="numeric" />
              <Select
                label="Kategória"
                name="cost_category"
                defaultValue={isVet ? "allatorvos" : "terapia"}
                options={EXPENSE_CATEGORIES}
              />
            </div>
            {isVet && event.vet_type !== "oltas" && (
              <p className="text-sm text-text-muted">Mentés után csatolhatod a kórlapot vagy a leletet.</p>
            )}
            <SubmitButton>Igen, megtörtént</SubmitButton>
          </ActionForm>
          <div className="mt-3 border-t border-border pt-3">
            <ActionForm action={completeEvent} className="">
              <input type="hidden" name="id" value={event.id} />
              <input type="hidden" name="outcome" value="missed" />
              <SubmitButton variant="secondary" className="w-full">
                Nem, elmaradt
              </SubmitButton>
            </ActionForm>
          </div>
        </section>
      )}

      {event.status !== "planned" && (
        <form action={reopenEvent.bind(null, event.id)} className="mb-6">
          <button type="submit" className={buttonClass("secondary")}>
            Visszaállítás tervezettre
          </button>
        </form>
      )}

      <details className="mb-6 rounded-2xl border border-border bg-surface">
        <summary className="cursor-pointer px-4 py-3 font-semibold">Szerkesztés</summary>
        <div className="px-4 pb-4">
          <EventForm
            action={updateEvent}
            petId={event.pet_id}
            event={event}
            vetTypes={VET_TYPES}
            taskTypes={taskTypes}
            vets={vetOptions(vets)}
            defaultDate={event.event_date}
          />
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <DeleteButton action={deleteEvent.bind(null, event.id)} label={event.series_id ? "Csak ez az alkalom törlése" : "Esemény törlése"} />
        {event.series_id && (
          <DeleteButton
            action={deleteSeriesFrom.bind(null, event.series_id, event.event_date)}
            label="Ez és a későbbi alkalmak törlése"
            confirmText="Törlöd ezt és a sorozat összes későbbi, még tervezett alkalmát?"
          />
        )}
      </div>
    </>
  );
}
