import "server-only";
import type { EventRowData } from "@/components/event-row";
import type { TodayItem } from "@/components/today-list";
import type { Tables } from "@/lib/database.types";
import { budapestDay, formatTime, shortTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const EVENT_SELECT = "id, category, vet_type, title, event_date, event_time, status, task_types(name)";

// Egy nap kipipálható tételei: gyógyszeradagok, reggeli és vacsora, feladatok, séták –
// a főoldalon a mai napra, a naplóban bármely korábbi napra.
export async function getDayItems(pet: Tables<"pets">, day: string) {
  const supabase = await createClient();
  const [{ data: doses }, { data: meals }, { data: events }, { data: walks }] = await Promise.all([
    supabase.rpc("scheduled_doses", { p_pet_id: pet.id, p_from: day, p_to: day }),
    supabase.from("meal_logs").select("*").eq("pet_id", pet.id).eq("day", day),
    supabase.from("calendar_events").select(EVENT_SELECT).eq("pet_id", pet.id).eq("event_date", day).order("event_time"),
    supabase.from("walk_logs").select("*").eq("pet_id", pet.id).eq("day", day),
  ]);

  // Rögzítési időpontot csak akkor írunk ki, ha az aznapra esik (utólagos pipálásnál nem).
  const timeOnDay = (iso: string | null) => (iso && budapestDay(iso) === day ? formatTime(iso) : null);

  const doseItems: TodayItem[] = (doses ?? []).map((d) => ({
    kind: "dose",
    key: `${d.medication_id}-${d.scheduled_for}`,
    time: formatTime(d.scheduled_for),
    title: d.name,
    detail: d.dosage,
    medicationId: d.medication_id,
    scheduledFor: d.scheduled_for,
    logId: d.log_id,
    status: d.status as "given" | "missed" | "refused" | null,
    doneAt: timeOnDay(d.given_at),
  }));
  const mealItems: TodayItem[] = (["reggeli", "vacsora"] as const).map((meal) => {
    const log = meals?.find((m) => m.meal === meal);
    return {
      kind: "meal",
      key: meal,
      time: shortTime(meal === "reggeli" ? pet.breakfast_time : pet.dinner_time),
      title: meal === "reggeli" ? "Reggeli" : "Vacsora",
      detail: null,
      meal,
      logId: log?.id ?? null,
      status: (log?.status as "eaten" | "partial" | "refused" | undefined) ?? null,
      doneAt: timeOnDay(log?.logged_at ?? null),
    };
  });
  const allEvents = (events ?? []) as EventRowData[];
  const taskItems: TodayItem[] = allEvents
    .filter((e) => e.category === "feladat")
    .map((e) => ({
      kind: "task",
      key: `t-${e.id}`,
      time: e.event_time ? shortTime(e.event_time) : "–",
      title: e.title,
      detail: e.task_types?.name && e.task_types.name !== e.title ? e.task_types.name : null,
      eventId: e.id,
      logId: null,
      status: e.status === "planned" ? null : (e.status as "done" | "missed"),
      doneAt: null,
    }));

  // Séták: a beállított időpontok és az extra séták (ezek nem számítanak a teendők közé).
  const walkItem = (time: string, log: Tables<"walk_logs"> | undefined, scheduled: boolean): TodayItem => ({
    kind: "walk",
    key: log && !scheduled ? `w-${log.id}` : `w-${time}`,
    time: shortTime(time),
    title: scheduled ? "Séta" : "Extra séta",
    detail: null,
    slotTime: time,
    logId: log?.id ?? null,
    status: log ? "done" : null,
    pee: log?.pee ?? false,
    poop: log?.poop ?? false,
    doneAt: null,
  });
  const walkItems: TodayItem[] = [
    ...pet.walk_times.map((t) => walkItem(t, walks?.find((w) => w.scheduled && w.time === t), true)),
    ...(walks ?? []).filter((w) => !w.scheduled || !pet.walk_times.includes(w.time)).map((w) => walkItem(w.time, w, false)),
  ];

  const items = [...doseItems, ...mealItems, ...taskItems, ...walkItems].sort((a, b) => a.time.localeCompare(b.time));
  return { items, vetEvents: allEvents.filter((e) => e.category === "orvosi") };
}

export type DoseEntry = { name: string; dosage: string | null; time: string; status: string | null; givenAt: string | null };
export type DoseSummary = { given: number; total: number; missed: string[]; doses: DoseEntry[] };

// Napi gyógyszer-összesítő egy időszakra (a naplóbejegyzések kártyáihoz).
export async function getDoseSummaries(petId: string, from: string, to: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("scheduled_doses", { p_pet_id: petId, p_from: from, p_to: to });
  const byDay = new Map<string, DoseSummary>();
  for (const d of data ?? []) {
    const s = byDay.get(d.day) ?? { given: 0, total: 0, missed: [], doses: [] };
    s.total++;
    s.doses.push({
      name: d.name,
      dosage: d.dosage,
      time: formatTime(d.scheduled_for),
      status: d.status,
      givenAt: d.given_at ? formatTime(d.given_at) : null,
    });
    if (d.status === "given") s.given++;
    else if (!s.missed.includes(d.name)) s.missed.push(d.name);
    byDay.set(d.day, s);
  }
  return byDay;
}

export type WalkSummary = { walks: number; pee: number; poop: number };

// Napi séta-összesítő egy időszakra (napló, kimutatás, PDF).
export async function getWalkSummaries(petId: string, from: string, to: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("walk_logs").select("day, pee, poop").eq("pet_id", petId).gte("day", from).lte("day", to);
  const byDay = new Map<string, WalkSummary>();
  for (const w of data ?? []) {
    const s = byDay.get(w.day) ?? { walks: 0, pee: 0, poop: 0 };
    s.walks++;
    if (w.pee) s.pee++;
    if (w.poop) s.poop++;
    byDay.set(w.day, s);
  }
  return byDay;
}

export function describeWalks(s: WalkSummary) {
  return `${s.walks} séta · ${s.pee} pisi · ${s.poop} kaki`;
}
