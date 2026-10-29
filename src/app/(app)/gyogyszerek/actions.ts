"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { optional, optionalNumber, required } from "@/lib/form";
import type { ActionResult } from "@/components/forms";

const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type PeriodFields = {
  start_date: string;
  end_date: string | null;
  interval_days: number;
  times: string[];
  dosage: string | null;
};

function readTimes(fd: FormData) {
  return [...new Set(fd.getAll("times").map(String).filter((t) => TIME_RE.test(t)))].sort();
}

// Egy időszak (kúra) adatai az űrlapból. Egyszerinél a kezdő és a záró nap ugyanaz.
function periodFields(fd: FormData, scheduleType: string): { fields?: PeriodFields; error?: string } {
  const times = readTimes(fd);
  const start = required(fd, "start_date");
  const end = scheduleType === "once" ? start : optional(fd, "end_date");
  const interval = scheduleType === "once" ? 1 : (optionalNumber(fd, "interval_days") ?? 1);
  if (!DATE_RE.test(start)) return { error: scheduleType === "once" ? "Add meg a dátumot." : "Add meg a kezdő dátumot." };
  if (times.length === 0) return { error: "Adj meg legalább egy időpontot." };
  if (scheduleType === "course" && !end) return { error: "Kúránál add meg a befejezés dátumát." };
  if (end && end < start) return { error: "A befejezés nem lehet a kezdés előtt." };
  if (!Number.isInteger(interval) || interval < 1) return { error: "Az ismétlődés legalább 1 nap legyen." };
  return { fields: { start_date: start, end_date: end, interval_days: interval, times, dosage: optional(fd, "period_dosage") } };
}

function medicationFields(fd: FormData) {
  return {
    name: required(fd, "name"),
    category: required(fd, "category"),
    dosage: optional(fd, "dosage"),
    reorder_on: optional(fd, "reorder_on"),
    notes: optional(fd, "notes"),
  };
}

// Két időszak átfedi-e egymást (a nyitott vég a végtelent jelenti).
function overlaps(a: { start_date: string; end_date: string | null }, b: { start_date: string; end_date: string | null }) {
  return a.start_date <= (b.end_date ?? "9999-12-31") && b.start_date <= (a.end_date ?? "9999-12-31");
}

async function checkOverlap(medicationId: string, period: PeriodFields, exceptId?: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("medication_periods").select("id, start_date, end_date").eq("medication_id", medicationId);
  const clash = (data ?? []).find((p) => p.id !== exceptId && overlaps(p, period));
  return clash ? "Ez az időszak átfedi egy korábbit. Előbb zárd le vagy módosítsd azt." : null;
}

export async function createMedication(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const scheduleType = required(fd, "schedule_type");
  if (!required(fd, "name")) return { error: "Add meg a nevét." };
  // Egyszerinél több dátum is megadható: mindegyik egy egynapos időszak.
  const dates =
    scheduleType === "once"
      ? [...new Set(fd.getAll("once_dates").map(String).filter((d) => DATE_RE.test(d)))].sort()
      : [required(fd, "start_date")];
  if (dates.length === 0) return { error: "Adj meg legalább egy dátumot." };
  const periods: PeriodFields[] = [];
  for (const date of dates) {
    fd.set("start_date", date);
    const parsed = periodFields(fd, scheduleType);
    if (!parsed.fields) return { error: parsed.error };
    periods.push({ ...parsed.fields, dosage: null });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medications")
    .insert({ pet_id: required(fd, "pet_id"), schedule_type: scheduleType, ...medicationFields(fd) })
    .select("id")
    .single();
  if (error) return { error: "Nem sikerült menteni." };
  const { error: periodError } = await supabase
    .from("medication_periods")
    .insert(periods.map((p) => ({ ...p, medication_id: data.id, pet_id: required(fd, "pet_id") })));
  if (periodError) {
    await supabase.from("medications").delete().eq("id", data.id);
    return { error: "Nem sikerült menteni az ütemezést." };
  }
  revalidatePath("/", "layout");
  redirect(`/gyogyszerek/${data.id}`);
}

export async function updateMedication(_: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!required(fd, "name")) return { error: "Add meg a nevét." };
  const supabase = await createClient();
  const { error } = await supabase.from("medications").update(medicationFields(fd)).eq("id", required(fd, "id"));
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

// Új kúra / új alkalom / újraindítás: új időszak ugyanahhoz a gyógyszerhez.
export async function addPeriod(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const medicationId = required(fd, "medication_id");
  const parsed = periodFields(fd, required(fd, "schedule_type"));
  if (!parsed.fields) return { error: parsed.error };
  const clash = await checkOverlap(medicationId, parsed.fields);
  if (clash) return { error: clash };
  const supabase = await createClient();
  const { error } = await supabase
    .from("medication_periods")
    // A pet_id-t az adatbázis a gyógyszerből tölti ki.
    .insert({ ...parsed.fields, medication_id: medicationId, pet_id: required(fd, "pet_id") });
  if (error) return { error: "Nem sikerült menteni." };
  await supabase.from("medications").update({ active: true }).eq("id", medicationId);
  revalidatePath("/", "layout");
  return { message: required(fd, "schedule_type") === "once" ? "Új alkalom hozzáadva." : "Új időszak elmentve." };
}

export async function updatePeriod(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = required(fd, "id");
  const medicationId = required(fd, "medication_id");
  const parsed = periodFields(fd, required(fd, "schedule_type"));
  if (!parsed.fields) return { error: parsed.error };
  const clash = await checkOverlap(medicationId, parsed.fields, id);
  if (clash) return { error: clash };
  const supabase = await createClient();
  const { error } = await supabase
    .from("medication_periods")
    .update({ ...parsed.fields, stop_reason: parsed.fields.end_date ? optional(fd, "stop_reason") : null })
    .eq("id", id);
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

export async function deletePeriod(id: string) {
  const supabase = await createClient();
  await supabase.from("medication_periods").delete().eq("id", id);
  revalidatePath("/", "layout");
}

type PeriodRow = { id: string; medication_id: string; pet_id: string; start_date: string; end_date: string | null; interval_days: number; times: string[]; dosage: string | null; stop_reason: string | null };
export type StopUndo = { medicationId: string; changed: { id: string; end_date: string | null; stop_reason: string | null }[]; deleted: PeriodRow[] };

// Abbahagyás: a folyamatban lévő időszak az adott nappal lezárul (az előzmény
// megmarad), a későbbre tervezettek törlődnek. Visszaadja, amivel visszavonható.
export async function stopMedication(medicationId: string, date: string, reason: string | null): Promise<StopUndo | { error: string }> {
  if (!DATE_RE.test(date)) return { error: "Add meg a dátumot." };
  const supabase = await createClient();
  const { data: periods } = await supabase.from("medication_periods").select("*").eq("medication_id", medicationId);
  const undo: StopUndo = { medicationId, changed: [], deleted: [] };
  for (const p of periods ?? []) {
    if (p.start_date > date) {
      undo.deleted.push(p);
      await supabase.from("medication_periods").delete().eq("id", p.id);
    } else if (!p.end_date || p.end_date >= date) {
      undo.changed.push({ id: p.id, end_date: p.end_date, stop_reason: p.stop_reason });
      await supabase.from("medication_periods").update({ end_date: date, stop_reason: reason }).eq("id", p.id);
    }
  }
  await supabase.from("medications").update({ active: false }).eq("id", medicationId);
  revalidatePath("/", "layout");
  return undo;
}

export async function undoStopMedication(undo: StopUndo) {
  const supabase = await createClient();
  for (const c of undo.changed) {
    await supabase.from("medication_periods").update({ end_date: c.end_date, stop_reason: c.stop_reason }).eq("id", c.id);
  }
  if (undo.deleted.length) await supabase.from("medication_periods").insert(undo.deleted);
  await supabase.from("medications").update({ active: true }).eq("id", undo.medicationId);
  revalidatePath("/", "layout");
}

// Egyszeri gyógyszer újra aktív (időszakot nem kell nyitni).
export async function reactivateMedication(id: string) {
  const supabase = await createClient();
  await supabase.from("medications").update({ active: true }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteMedication(id: string) {
  const supabase = await createClient();
  await supabase.from("medications").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/gyogyszerek");
}

export async function addPurchase(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const medicationId = required(fd, "medication_id");
  const supabase = await createClient();
  const { error } = await supabase.from("medication_purchases").insert({
    medication_id: medicationId,
    // A valódi értéket az adatbázis tölti ki a gyógyszer alapján.
    pet_id: required(fd, "pet_id"),
    purchased_on: required(fd, "purchased_on"),
    quantity: optional(fd, "quantity"),
    cost_huf: optionalNumber(fd, "cost_huf"),
    notes: optional(fd, "notes"),
  });
  if (error) return { error: "Nem sikerült menteni." };

  const nextReorder = optional(fd, "reorder_on");
  if (nextReorder) {
    await supabase.from("medications").update({ reorder_on: nextReorder }).eq("id", medicationId);
  }
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

export async function deletePurchase(id: string) {
  const supabase = await createClient();
  await supabase.from("medication_purchases").delete().eq("id", id);
  revalidatePath("/", "layout");
}
