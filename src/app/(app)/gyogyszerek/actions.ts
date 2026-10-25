"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { optional, optionalNumber, required } from "@/lib/form";
import type { ActionResult } from "@/components/forms";

const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Az űrlapból kiolvassa és ellenőrzi a gyógyszer adatait és ütemezését.
function medicationFields(fd: FormData) {
  const scheduleType = required(fd, "schedule_type");
  const times = [...new Set(fd.getAll("times").map(String).filter((t) => TIME_RE.test(t)))].sort();
  // Egyszeri: több alkalom is lehet, a legkorábbi a kezdő dátum.
  const onceDates =
    scheduleType === "once"
      ? [...new Set(fd.getAll("once_dates").map(String).filter((d) => DATE_RE.test(d)))].sort()
      : [];
  const startDate = scheduleType === "once" ? (onceDates[0] ?? "") : required(fd, "start_date");
  const endDate = scheduleType === "course" ? optional(fd, "end_date") : null;
  const interval = scheduleType === "once" ? null : (optionalNumber(fd, "interval_days") ?? 1);

  if (!required(fd, "name")) return { error: "Add meg a nevét." };
  if (!startDate) return { error: scheduleType === "once" ? "Adj meg legalább egy dátumot." : "Add meg a kezdő dátumot." };
  if (times.length === 0) return { error: "Adj meg legalább egy időpontot." };
  if (scheduleType === "course" && !endDate) return { error: "Kúránál add meg a befejezés dátumát." };
  if (endDate && endDate < startDate) return { error: "A befejezés nem lehet a kezdés előtt." };
  if (interval !== null && (!Number.isInteger(interval) || interval < 1)) {
    return { error: "Az ismétlődés legalább 1 nap legyen." };
  }

  return {
    fields: {
      name: required(fd, "name"),
      category: required(fd, "category"),
      dosage: optional(fd, "dosage"),
      schedule_type: scheduleType,
      start_date: startDate,
      once_dates: onceDates,
      end_date: endDate,
      interval_days: interval,
      times,
      reorder_on: optional(fd, "reorder_on"),
      notes: optional(fd, "notes"),
    },
  };
}

export async function createMedication(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const parsed = medicationFields(fd);
  if (!parsed.fields) return { error: parsed.error };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medications")
    .insert({ pet_id: required(fd, "pet_id"), ...parsed.fields })
    .select("id")
    .single();
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  redirect(`/gyogyszerek/${data.id}`);
}

export async function updateMedication(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const parsed = medicationFields(fd);
  if (!parsed.fields) return { error: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase.from("medications").update(parsed.fields).eq("id", required(fd, "id"));
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

// Egyszeri gyógyszer újabb alkalma (a korábbiak megmaradnak).
export async function addOnceDate(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = required(fd, "id");
  const date = required(fd, "date");
  if (!DATE_RE.test(date)) return { error: "Add meg a dátumot." };
  const supabase = await createClient();
  const { data: med } = await supabase.from("medications").select("once_dates").eq("id", id).maybeSingle();
  if (!med) return { error: "Nem található." };
  const dates = [...new Set([...med.once_dates, date])].sort();
  const { error } = await supabase
    .from("medications")
    .update({ once_dates: dates, start_date: dates[0], active: true })
    .eq("id", id);
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Új alkalom hozzáadva." };
}

export async function setMedicationActive(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("medications").update({ active }).eq("id", id);
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
