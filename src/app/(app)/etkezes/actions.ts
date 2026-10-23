"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { optional, optionalNumber, required } from "@/lib/form";
import type { ActionResult } from "@/components/forms";

function foodFields(fd: FormData) {
  return {
    kind: required(fd, "kind") === "jutalomfalat" ? "jutalomfalat" : "tap",
    name: required(fd, "name"),
    food_type: optional(fd, "food_type"),
    daily_grams: optionalNumber(fd, "daily_grams"),
    reorder_on: optional(fd, "reorder_on"),
    notes: optional(fd, "notes"),
  };
}

export async function addFood(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const failed = fd.get("status") === "failed";
  const supabase = await createClient();
  const { error } = await supabase.from("foods").insert({
    pet_id: required(fd, "pet_id"),
    ...foodFields(fd),
    status: failed ? "failed" : "active",
    fail_reason: failed ? optional(fd, "fail_reason") : null,
  });
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

export async function updateFood(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("foods")
    .update({ ...foodFields(fd), fail_reason: optional(fd, "fail_reason") })
    .eq("id", required(fd, "id"));
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

export async function setFoodStatus(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const status = required(fd, "status");
  const supabase = await createClient();
  const { error } = await supabase
    .from("foods")
    .update({ status, fail_reason: status === "failed" ? optional(fd, "fail_reason") : null })
    .eq("id", required(fd, "id"));
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

export async function deleteFood(id: string) {
  const supabase = await createClient();
  await supabase.from("foods").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/etkezes");
}

export async function addFoodPurchase(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const foodId = required(fd, "food_id");
  const supabase = await createClient();
  const { error } = await supabase.from("food_purchases").insert({
    food_id: foodId,
    pet_id: required(fd, "pet_id"),
    purchased_on: required(fd, "purchased_on"),
    quantity: optional(fd, "quantity"),
    cost_huf: optionalNumber(fd, "cost_huf"),
  });
  if (error) return { error: "Nem sikerült menteni." };
  const nextReorder = optional(fd, "reorder_on");
  if (nextReorder) await supabase.from("foods").update({ reorder_on: nextReorder }).eq("id", foodId);
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

export async function deleteFoodPurchase(id: string) {
  const supabase = await createClient();
  await supabase.from("food_purchases").delete().eq("id", id);
  revalidatePath("/", "layout");
}
