import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventRow, type EventRowData } from "@/components/event-row";
import { ButtonLink, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatDate, todayIso } from "@/lib/format";
import { requireCurrentPet } from "@/lib/pets";

export const metadata = { title: "Naptár" };

const WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
const SELECT = "id, category, vet_type, title, event_date, event_time, status, task_types(name)";

function monthInfo(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // hétfő = 0
  const prev = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  const label = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", timeZone: "UTC" }).format(first);
  return { daysInMonth, offset, prev, next, label, first: `${month}-01`, last: `${month}-${String(daysInMonth).padStart(2, "0")}` };
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ ho?: string; nap?: string }> }) {
  const pet = await requireCurrentPet();
  const { ho, nap } = await searchParams;
  const today = todayIso();
  const selected = nap && /^\d{4}-\d{2}-\d{2}$/.test(nap) ? nap : null;
  const month = ho && /^\d{4}-\d{2}$/.test(ho) ? ho : (selected ?? today).slice(0, 7);
  const info = monthInfo(month);
  const supabase = await createClient();

  const [{ data: monthEvents }, { data: upcoming }, { data: pending }, { data: past }] = await Promise.all([
    supabase.from("calendar_events").select(SELECT).eq("pet_id", pet.id).gte("event_date", info.first).lte("event_date", info.last).order("event_time"),
    supabase.from("calendar_events").select(SELECT).eq("pet_id", pet.id).eq("status", "planned").gte("event_date", today).lte("event_date", addDays(today, 90)).order("event_date").order("event_time").limit(15),
    supabase.from("calendar_events").select(SELECT).eq("pet_id", pet.id).eq("status", "planned").lt("event_date", today).order("event_date", { ascending: false }),
    supabase.from("calendar_events").select(SELECT).eq("pet_id", pet.id).neq("status", "planned").order("event_date", { ascending: false }).limit(20),
  ]);

  const byDay = new Map<string, EventRowData[]>();
  for (const e of (monthEvents ?? []) as EventRowData[]) byDay.set(e.event_date, [...(byDay.get(e.event_date) ?? []), e]);
  const selectedEvents = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <>
      <PageHeader
        title="Naptár"
        subtitle={pet.name}
        action={<ButtonLink href={`/naptar/uj${selected ? `?nap=${selected}` : ""}`}>+ Új</ButtonLink>}
      />

      <section className="mb-6 rounded-2xl border border-border bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <Link href={`/naptar?ho=${info.prev}`} aria-label="Előző hónap" className="flex size-11 items-center justify-center rounded-xl hover:bg-surface-muted">
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
          <h2 className="font-bold first-letter:uppercase">{info.label}</h2>
          <Link href={`/naptar?ho=${info.next}`} aria-label="Következő hónap" className="flex size-11 items-center justify-center rounded-xl hover:bg-surface-muted">
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-text-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: info.offset }, (_, i) => (
            <div key={`e${i}`} />
          ))}
          {Array.from({ length: info.daysInMonth }, (_, i) => {
            const day = `${month}-${String(i + 1).padStart(2, "0")}`;
            const events = byDay.get(day) ?? [];
            const isSelected = day === selected;
            const isToday = day === today;
            return (
              <Link
                key={day}
                href={`/naptar?nap=${day}`}
                aria-label={`${formatDate(day)}${events.length ? `, ${events.length} esemény` : ""}`}
                aria-current={isSelected ? "date" : undefined}
                className={`flex h-12 flex-col items-center justify-center gap-1 rounded-xl text-sm ${
                  isSelected
                    ? "bg-primary font-bold text-on-primary"
                    : isToday
                      ? "bg-primary-soft font-bold text-link"
                      : "hover:bg-surface-muted"
                }`}
              >
                {i + 1}
                <span className="flex h-1.5 gap-0.5">
                  {events.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`size-1.5 rounded-full ${
                        isSelected ? "bg-on-primary" : e.category === "orvosi" ? "bg-primary" : "bg-warn-text"
                      }`}
                    />
                  ))}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {selected && (
        <section className="mb-6">
          <SectionTitle action={<Link href={`/naptar/uj?nap=${selected}`} className="text-sm font-semibold text-link">+ Erre a napra</Link>}>
            {formatDate(selected)}
          </SectionTitle>
          {selectedEvents.length ? (
            <ul className="flex flex-col gap-2">
              {selectedEvents.map((e) => (
                <EventRow key={e.id} event={e} showDate={false} />
              ))}
            </ul>
          ) : (
            <EmptyState>Erre a napra nincs esemény.</EmptyState>
          )}
        </section>
      )}

      {!!pending?.length && (
        <section className="mb-6">
          <SectionTitle>Visszajelzésre vár</SectionTitle>
          <p className="mb-2 text-sm text-text-muted">Megtörtént? Kattints rá, és rögzítsd az eredményt.</p>
          <ul className="flex flex-col gap-2">
            {(pending as EventRowData[]).map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6">
        <SectionTitle>Közelgő</SectionTitle>
        {upcoming?.length ? (
          <ul className="flex flex-col gap-2">
            {(upcoming as EventRowData[]).map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ul>
        ) : (
          <EmptyState>Nincs tervezett esemény. Vegyél fel vizsgálatot, oltást vagy egyéb feladatot.</EmptyState>
        )}
      </section>

      {!!past?.length && (
        <section>
          <SectionTitle>Korábbiak</SectionTitle>
          <ul className="flex flex-col gap-2">
            {(past as EventRowData[]).map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
