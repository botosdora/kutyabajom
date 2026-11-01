"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { budapestToIso, todayIso } from "@/lib/format";
import { required } from "@/lib/form";
import type { ActionResult } from "@/components/forms";

export type DoseStatus = "given" | "missed" | "refused";
export type MealStatus = "eaten" | "partial" | "refused";

// Egy gyógyszeradag rögzítése. Ha `actualTime` meg van adva ("HH:MM"), az a
// tényleges beadás ideje (mai nap), különben a mostani időpont.
export async function logDose(
  petId: string,
  medicationId: string,
  scheduledFor: string,
  status: DoseStatus,
  actualTime?: string,
  day?: string,
) {
  const supabase = await createClient();
  // Utólagos rögzítésnél (korábbi nap) a beadás ideje alapból a tervezett időpont.
  const pastDay = day && day !== todayIso();
  const givenAt =
    status !== "given"
      ? null
      : actualTime
        ? budapestToIso(day ?? todayIso(), actualTime)
        : pastDay
          ? scheduledFor
          : new Date().toISOString();
  await supabase.from("dose_logs").upsert(
    { pet_id: petId, medication_id: medicationId, scheduled_for: scheduledFor, status, given_at: givenAt },
    { onConflict: "medication_id,scheduled_for" },
  );
  revalidatePath("/", "layout");
}

export async function undoDose(logId: string) {
  const supabase = await createClient();
  await supabase.from("dose_logs").delete().eq("id", logId);
  revalidatePath("/", "layout");
}

export async function logMeal(petId: string, day: string, meal: "reggeli" | "vacsora", status: MealStatus) {
  const supabase = await createClient();
  await supabase
    .from("meal_logs")
    .upsert({ pet_id: petId, day, meal, status, logged_at: new Date().toISOString() }, { onConflict: "pet_id,day,meal" });
  revalidatePath("/", "layout");
}

export async function undoMeal(logId: string) {
  const supabase = await createClient();
  await supabase.from("meal_logs").delete().eq("id", logId);
  revalidatePath("/", "layout");
}

// Séták ---------------------------------------------------------------------------------

export type WalkFlags = { pee?: boolean; poop?: boolean };

// Beállított séta megjelölése (vagy a pisi/kaki módosítása). Ha még nincs
// rögzítve, létrejön; a pisi/kaki kapcsolása egyben a sétát is rögzíti.
export async function logWalk(petId: string, day: string, time: string, logId: string | null, flags: WalkFlags = {}) {
  const supabase = await createClient();
  // Gyors egymás utáni koppintásnál a második hívás még nem tudja az új sor azonosítóját.
  if (!logId) {
    const { data } = await supabase
      .from("walk_logs")
      .select("id")
      .eq("pet_id", petId)
      .eq("day", day)
      .eq("time", time)
      .eq("scheduled", true)
      .maybeSingle();
    logId = data?.id ?? null;
  }
  if (logId) {
    await supabase.from("walk_logs").update(flags).eq("id", logId);
  } else {
    await supabase.from("walk_logs").insert({ pet_id: petId, day, time, scheduled: true, ...flags });
  }
  revalidatePath("/", "layout");
}

export async function undoWalk(logId: string) {
  const supabase = await createClient();
  await supabase.from("walk_logs").delete().eq("id", logId);
  revalidatePath("/", "layout");
}

export async function addExtraWalk(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const time = required(fd, "time");
  if (!/^\d{2}:\d{2}$/.test(time)) return { error: "Add meg az időpontot." };
  const supabase = await createClient();
  const { error } = await supabase.from("walk_logs").insert({
    pet_id: required(fd, "pet_id"),
    day: required(fd, "day") || todayIso(),
    time,
    scheduled: false,
    pee: fd.get("pee") === "on",
    poop: fd.get("poop") === "on",
  });
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Séta rögzítve." };
}

export async function updateWalkTimes(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const times = [...new Set(fd.getAll("walk_times").map(String).filter((t) => /^\d{2}:\d{2}$/.test(t)))].sort();
  const supabase = await createClient();
  const { error } = await supabase.from("pets").update({ walk_times: times }).eq("id", required(fd, "pet_id"));
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: times.length ? "Séták időpontjai elmentve." : "Séták kikapcsolva." };
}
