"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { optional, optionalNumber, required } from "@/lib/form";
import { OBSERVATIONS, SCALES } from "@/lib/journal";
import type { ActionResult } from "@/components/forms";

function scaleValue(fd: FormData, key: string) {
  const n = optionalNumber(fd, key);
  return n === null ? null : Math.min(10, Math.max(0, Math.round(n)));
}

export async function saveLog(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const scales = Object.fromEntries(SCALES.map((s) => [s.key, scaleValue(fd, s.key)]));
  const allowed = new Set(OBSERVATIONS.map((o) => o.value));
  const supabase = await createClient();
  const { error } = await supabase.from("daily_logs").upsert(
    {
      pet_id: required(fd, "pet_id"),
      day: required(fd, "day"),
      ...scales,
      pain_duration: optional(fd, "pain_duration"),
      water_ml: optionalNumber(fd, "water_ml"),
      stool: optional(fd, "stool"),
      observations: fd.getAll("observations").map(String).filter((o) => allowed.has(o)),
      notes: optional(fd, "notes"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "pet_id,day" },
  );
  if (error) return { error: "Nem sikerült menteni a naplót." };
  revalidatePath("/", "layout");
  return { message: "Napló elmentve." };
}

export async function deleteLog(id: string) {
  const supabase = await createClient();
  await supabase.from("daily_logs").delete().eq("id", id);
  revalidatePath("/", "layout");
}
