import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AddPanel } from "@/components/forms";
import { MedicalEventFields } from "@/components/medical-event-fields";
import { EmptyState, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate, todayIso } from "@/lib/format";
import { EVENT_KINDS, eventKindLabel, getVets, vetOptions } from "@/lib/health";
import { requireCurrentPet } from "@/lib/pets";
import { addMedicalEvent } from "../actions";

export const metadata = { title: "Orvosi beavatkozások" };

export default async function MedicalEventsPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const [{ data: events }, vets] = await Promise.all([
    supabase
      .from("medical_events")
      .select("id, event_date, kind, title, vets(name)")
      .eq("pet_id", pet.id)
      .order("event_date", { ascending: false }),
    getVets(pet.id),
  ]);

  // Évenként csoportosítva, a legfrissebb elöl.
  const byYear = new Map<string, NonNullable<typeof events>>();
  for (const e of events ?? []) {
    const year = e.event_date.slice(0, 4);
    byYear.set(year, [...(byYear.get(year) ?? []), e]);
  }

  return (
    <>
      <PageHeader title="Orvosi beavatkozások" subtitle={pet.name} back={{ href: "/egeszseg", label: "Egészség" }} />

      <div className="mb-6">
        <AddPanel label="Új esemény" action={addMedicalEvent}>
          <input type="hidden" name="pet_id" value={pet.id} />
          <MedicalEventFields kinds={EVENT_KINDS} vets={vetOptions(vets)} today={todayIso()} />
        </AddPanel>
      </div>

      {byYear.size === 0 ? (
        <EmptyState>Még nincs rögzített esemény. Korábbi eseményeket is felvehetsz.</EmptyState>
      ) : (
        [...byYear].map(([year, list]) => (
          <section key={year} className="mb-6">
            <h2 className="mb-2 text-sm font-bold text-text-muted">{year}</h2>
            <ol className="relative ml-2 border-l-2 border-border">
              {list.map((e) => (
                <li key={e.id} className="relative pb-2 pl-5">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[7px] top-5 size-3 rounded-full border-2 border-surface bg-primary"
                  />
                  <Link
                    href={`/egeszseg/beavatkozasok/${e.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-muted"
                  >
                    <span className="flex-1">
                      <span className="block font-semibold">{e.title}</span>
                      <span className="block text-sm text-text-muted">
                        {formatDate(e.event_date)} · {eventKindLabel(e.kind)}
                        {e.vets?.name && ` · ${e.vets.name}`}
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </>
  );
}
