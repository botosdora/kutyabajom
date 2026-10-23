"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { optional, optionalNumber, required } from "@/lib/form";
import type { ActionResult } from "@/components/forms";

// Új kiadás. Gyógyszernél a gyógyszer vásárlásai közé kerül, állatorvosnál
// egy meglévő vagy új orvosi eseményhez kapcsolódik.
export async function addExpense(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const petId = required(fd, "pet_id");
  const category = required(fd, "category");
  const amount = optionalNumber(fd, "amount_huf");
  const spentOn = required(fd, "spent_on");
  const title = optional(fd, "title");
  if (amount === null || amount < 0) return { error: "Adj meg egy érvényes összeget." };
  const supabase = await createClient();

  if (category === "gyogyszer" && optional(fd, "medication_id")) {
    const { error } = await supabase.from("medication_purchases").insert({
      pet_id: petId,
      medication_id: required(fd, "medication_id"),
      purchased_on: spentOn,
      cost_huf: Math.round(amount),
      quantity: title,
      notes: optional(fd, "notes"),
    });
    if (error) return { error: "Nem sikerült menteni." };
    revalidatePath("/", "layout");
    return { message: "Elmentve a gyógyszer vásárlásai közé is." };
  }

  if (!title) return { error: "Add meg, mire ment a kiadás." };
  let medicalEventId = category === "allatorvos" ? optional(fd, "medical_event_id") : null;
  if (medicalEventId === "__new") {
    const { data, error } = await supabase
      .from("medical_events")
      .insert({ pet_id: petId, event_date: spentOn, kind: "vizsgalat", title, description: optional(fd, "notes") })
      .select("id")
      .single();
    if (error) return { error: "Nem sikerült létrehozni az orvosi eseményt." };
    medicalEventId = data.id;
  }

  const { error } = await supabase.from("expenses").insert({
    pet_id: petId,
    spent_on: spentOn,
    category,
    amount_huf: Math.round(amount),
    title,
    notes: optional(fd, "notes"),
    medical_event_id: medicalEventId,
  });
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

export async function deleteExpense(id: string, source: string) {
  const supabase = await createClient();
  if (source === "medication_purchase") await supabase.from("medication_purchases").delete().eq("id", id);
  else await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/", "layout");
}
