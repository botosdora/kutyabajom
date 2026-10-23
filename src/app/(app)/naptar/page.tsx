import Link from "next/link";
import { cookies } from "next/headers";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, History, Pill, X } from "lucide-react";
import { EventRow, type EventRowData } from "@/components/event-row";
import { ButtonLink, EmptyState, LoadMore, PageHeader, pageLimit, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { CALENDAR_FILTER_COOKIE, CALENDAR_LAYERS, parseCalendarFilter } from "@/lib/calendar";
import { addDays, formatDate, formatTime, todayIso } from "@/lib/format";
import { requireCurrentPet } from "@/lib/pets";
import { toggleCalendarFilter } from "./actions";

export const metadata = { title: "Naptár" };

const WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
const SELECT = "id, category, vet_type, title, event_date, event_time, status, task_types(name)";
const LAYER_COLOR = Object.fromEntries(CALENDAR_LAYERS.map((l) => [l.key, l.color]));

type Dose = { medication_id: string; name: string; dosage: string; day: string; scheduled_for: string; status: string | null };

function monthGrid(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7; // hétfő = 0
  const start = addDays(`${month}-01`, -offset);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  return {
    days,
    start,
    end: days[days.length - 1],
    prev: new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7),
    next: new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7),
    label: new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", timeZone: "UTC" }).format(first),
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ho?: string; nap?: string; db?: string }>;
}) {
  const pet = await requireCurrentPet();
  const { ho, nap, db } = await searchParams;
  const today = todayIso();
  const selected = nap && /^\d{4}-\d{2}-\d{2}$/.test(nap) ? nap : today;
  const month = ho && /^\d{4}-\d{2}$/.test(ho) ? ho : selected.slice(0, 7);
  const grid = monthGrid(month);
  const layers = parseCalendarFilter((await cookies()).get(CALENDAR_FILTER_COOKIE)?.value);
  const limit = pageLimit(db);
  const supabase = await createClient();

  const [{ data: gridEvents }, { data: upcoming }, { data: pending }, { data: past, count: pastCount }, { data: doses }] =
    await Promise.all([
      supabase.from("calendar_events").select(SELECT).eq("pet_id", pet.id).gte("event_date", grid.start).lte("event_date", grid.end).order("event_time"),
      supabase.from("calendar_events").select(SELECT).eq("pet_id", pet.id).eq("status", "planned").gt("event_date", today).lte("event_date", addDays(today, 90)).order("event_date").order("event_time").limit(10),
      supabase.from("calendar_events").select(SELECT).eq("pet_id", pet.id).eq("status", "planned").lt("event_date", today).order("event_date", { ascending: false }),
      supabase.from("calendar_events").select(SELECT, { count: "exact" }).eq("pet_id", pet.id).neq("status", "planned").order("event_date", { ascending: false }).limit(limit),
      layers.has("gyogyszer")
        ? supabase.rpc("scheduled_doses", { p_pet_id: pet.id, p_from: grid.start, p_to: grid.end })
        : Promise.resolve({ data: [] as Dose[] }),
    ]);

  const events = ((gridEvents ?? []) as EventRowData[]).filter((e) => layers.has(e.category));
  const eventsByDay = new Map<string, EventRowData[]>();
  for (const e of events) eventsByDay.set(e.event_date, [...(eventsByDay.get(e.event_date) ?? []), e]);
  const dosesByDay = new Map<string, Dose[]>();
  for (const d of (doses ?? []) as Dose[]) dosesByDay.set(d.day, [...(dosesByDay.get(d.day) ?? []), d]);
  const dayEvents = eventsByDay.get(selected) ?? [];
  const dayDoses = dosesByDay.get(selected) ?? [];

  return (
    <div className="wide mx-auto flex max-w-4xl flex-col">
      <PageHeader
        title="Naptár"
        subtitle={pet.name}
        icon={CalendarDays}
        action={<ButtonLink href={`/naptar/uj?nap=${selected}`}>+ Új</ButtonLink>}
      />

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Megjelenített elemek">
        {CALENDAR_LAYERS.map((l) => {
          const on = layers.has(l.key);
          return (
            <form key={l.key} action={toggleCalendarFilter.bind(null, l.key)}>
              <button
                type="submit"
                aria-pressed={on}
                className={`flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold ${
                  on ? "border-border-strong bg-surface" : "border-transparent bg-surface-muted text-text-muted"
                }`}
              >
                <span className="flex size-4 items-center justify-center rounded-full" style={{ background: on ? l.color : "var(--border-strong)" }}>
                  {on && <Check size={11} strokeWidth={3} className="text-white" aria-hidden="true" />}
                </span>
                {l.label}
              </button>
            </form>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <section className="rounded-3xl border border-border bg-surface p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center gap-2 px-1">
            <h2 className="flex-1 text-xl font-bold first-letter:uppercase">{grid.label}</h2>
            {month !== today.slice(0, 7) && (
              <Link href="/naptar" className="h-9 rounded-xl bg-surface-muted px-3 text-sm font-semibold leading-9 hover:bg-border">
                Ma
              </Link>
            )}
            <Link href={`/naptar?ho=${grid.prev}`} aria-label="Előző hónap" className="flex size-10 items-center justify-center rounded-xl bg-surface-muted hover:bg-border">
              <ChevronLeft size={20} aria-hidden="true" />
            </Link>
            <Link href={`/naptar?ho=${grid.next}`} aria-label="Következő hónap" className="flex size-10 items-center justify-center rounded-xl bg-surface-muted hover:bg-border">
              <ChevronRight size={20} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-7 pb-1 text-center text-xs font-semibold text-text-muted">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.days.map((day, i) => {
              const inMonth = day.startsWith(month);
              const isSelected = day === selected;
              const isToday = day === today;
              const dayEv = eventsByDay.get(day) ?? [];
              const doseCount = dosesByDay.get(day)?.length ?? 0;
              const weekend = i % 7 >= 5;
              return (
                <Link
                  key={day}
                  href={`/naptar?ho=${month}&nap=${day}`}
                  scroll={false}
                  aria-label={`${formatDate(day)}${dayEv.length ? `, ${dayEv.length} esemény` : ""}${doseCount ? `, ${doseCount} adag` : ""}`}
                  aria-current={isSelected ? "date" : undefined}
                  className={`flex min-h-14 flex-col gap-1 rounded-xl p-1.5 text-left transition-colors sm:min-h-20 ${
                    isSelected ? "bg-primary text-on-primary" : isToday ? "bg-primary-soft" : "hover:bg-surface-muted"
                  } ${inMonth ? "" : "opacity-40"}`}
                >
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      isSelected ? "" : isToday ? "text-link" : weekend ? "text-text-muted" : ""
                    }`}
                  >
                    {Number(day.slice(8))}
                  </span>
                  {/* Mobilon színes pöttyök, nagyobb kijelzőn rövid címkék. */}
                  <span className="flex flex-wrap gap-0.5 sm:hidden">
                    {dayEv.slice(0, 3).map((e) => (
                      <span key={e.id} className="size-1.5 rounded-full" style={{ background: isSelected ? "currentColor" : LAYER_COLOR[e.category] }} />
                    ))}
                    {doseCount > 0 && (
                      <span className="size-1.5 rounded-full" style={{ background: isSelected ? "currentColor" : LAYER_COLOR.gyogyszer }} />
                    )}
                  </span>
                  <span className="hidden flex-col gap-0.5 sm:flex">
                    {dayEv.slice(0, 2).map((e) => (
                      <span
                        key={e.id}
                        className={`truncate rounded-md px-1 text-[11px] font-medium leading-4 ${isSelected ? "bg-white/20" : "bg-surface-muted"}`}
                      >
                        <span className="mr-1 inline-block size-1.5 rounded-full align-middle" style={{ background: isSelected ? "currentColor" : LAYER_COLOR[e.category] }} />
                        {e.title}
                      </span>
                    ))}
                    {dayEv.length > 2 && <span className="px-1 text-[11px]">+{dayEv.length - 2}</span>}
                    {doseCount > 0 && (
                      <span className={`flex items-center gap-1 px-1 text-[11px] ${isSelected ? "" : "text-text-muted"}`}>
                        <Pill size={11} aria-hidden="true" /> {doseCount}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle
            action={
              <Link href={`/naptar/uj?nap=${selected}`} className="text-sm font-semibold text-link">
                + Erre a napra
              </Link>
            }
          >
            <span className="first-letter:uppercase">{selected === today ? "Ma" : formatDate(selected)}</span>
          </SectionTitle>
          {dayEvents.length === 0 && dayDoses.length === 0 ? (
            <EmptyState>Erre a napra nincs bejegyzés.</EmptyState>
          ) : (
            <>
              {dayEvents.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {dayEvents.map((e) => (
                    <EventRow key={e.id} event={e} showDate={false} />
                  ))}
                </ul>
              )}
              {dayDoses.length > 0 && (
                <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
                  {dayDoses.map((d) => (
                    <li key={`${d.medication_id}-${d.scheduled_for}`} className="flex items-center gap-3 px-4 py-2.5">
                      <Pill size={18} style={{ color: LAYER_COLOR.gyogyszer }} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{d.name}</span>
                        <span className="block text-xs text-text-muted">
                          {formatTime(d.scheduled_for)}
                          {d.dosage && ` · ${d.dosage}`}
                        </span>
                      </span>
                      {d.status === "given" ? (
                        <span className="flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                          <Check size={12} aria-hidden="true" /> Beadva
                        </span>
                      ) : d.status ? (
                        <span className="flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                          <X size={12} aria-hidden="true" /> {d.status === "refused" ? "Elutasította" : "Kimaradt"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Clock size={12} aria-hidden="true" /> {selected < today ? "Nincs rögzítve" : "Tervezett"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {!!pending?.length && (
            <div className="mt-3">
              <SectionTitle>Visszajelzésre vár</SectionTitle>
              <p className="mb-2 text-sm text-text-muted">Megtörtént? Koppints rá, és rögzítsd az eredményt.</p>
              <ul className="flex flex-col gap-2">
                {(pending as EventRowData[]).map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3">
            <SectionTitle>Közelgő</SectionTitle>
            {upcoming?.length ? (
              <ul className="flex flex-col gap-2">
                {(upcoming as EventRowData[]).map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </ul>
            ) : (
              <EmptyState>Nincs tervezett esemény a következő 3 hónapban.</EmptyState>
            )}
          </div>
        </section>
      </div>

      {!!past?.length && (
        <section className="mt-8">
          <SectionTitle icon={History}>Korábbiak</SectionTitle>
          <ul className="flex flex-col gap-2">
            {(past as EventRowData[]).map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ul>
          <LoadMore shown={past.length} total={pastCount ?? 0} href={(n) => `/naptar?ho=${month}&nap=${selected}&db=${n}`} />
        </section>
      )}
    </div>
  );
}
