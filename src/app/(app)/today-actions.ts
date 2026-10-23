"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { budapestToIso, todayIso } from "@/lib/format";

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
) {
  const supabase = await createClient();
  const givenAt =
    status !== "given" ? null : actualTime ? budapestToIso(todayIso(), actualTime) : new Date().toISOString();
  await supabase.from("dose_logs").upsert(
    { pet_id: petId, medication_id: medicationId, scheduled_for: scheduledFor, status, given_at: givenAt },
    { onConflict: "medication_id,scheduled_for" },
  );
  revalidatePath("/");
}

export async function undoDose(logId: string) {
  const supabase = await createClient();
  await supabase.from("dose_logs").delete().eq("id", logId);
  revalidatePath("/");
}

export async function logMeal(petId: string, day: string, meal: "reggeli" | "vacsora", status: MealStatus) {
  const supabase = await createClient();
  await supabase
    .from("meal_logs")
    .upsert({ pet_id: petId, day, meal, status, logged_at: new Date().toISOString() }, { onConflict: "pet_id,day,meal" });
  revalidatePath("/");
}

export async function undoMeal(logId: string) {
  const supabase = await createClient();
  await supabase.from("meal_logs").delete().eq("id", logId);
  revalidatePath("/");
}
