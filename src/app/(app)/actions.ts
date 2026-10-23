"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CURRENT_PET_COOKIE, requireUser } from "@/lib/pets";
import { ACCENT_COOKIE, parseAccent, parseTheme, THEME_COOKIE } from "@/lib/appearance";
import type { ActionResult } from "@/components/forms";
import { optional } from "@/lib/form";

async function rememberPet(petId: string) {
  (await cookies()).set(CURRENT_PET_COOKIE, petId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function selectPet(petId: string) {
  await rememberPet(petId);
  revalidatePath("/", "layout");
}

export async function createPet(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_pet", {
    p_name: String(formData.get("name")).trim(),
    p_breed: optional(formData, "breed") ?? undefined,
    p_sex: optional(formData, "sex") ?? undefined,
    p_birth_date: optional(formData, "birth_date") ?? undefined,
    p_chip_number: optional(formData, "chip_number") ?? undefined,
  });
  if (error || !data) return { error: "Nem sikerült menteni a kutyát." };

  const weight = optional(formData, "weight_kg");
  if (weight) {
    await supabase.from("weights").insert({ pet_id: data, weight_kg: Number(weight.replace(",", ".")) });
  }
  await rememberPet(data);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updatePet(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pets")
    .update({
      name: String(formData.get("name")).trim(),
      breed: optional(formData, "breed"),
      sex: optional(formData, "sex"),
      birth_date: optional(formData, "birth_date"),
      chip_number: optional(formData, "chip_number"),
      notes: optional(formData, "notes"),
    })
    .eq("id", String(formData.get("pet_id")));
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

export async function deletePet(petId: string) {
  const supabase = await createClient();
  await supabase.from("pets").delete().eq("id", petId);
  (await cookies()).delete(CURRENT_PET_COOKIE);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function addMember(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_pet_member", {
    p_pet_id: String(formData.get("pet_id")),
    p_email: String(formData.get("email")),
  });
  if (error) return { error: "Nem sikerült hozzáadni." };
  if (data === "nincs_ilyen_felhasznalo") {
    return { error: "Ezzel az e-mail címmel még nincs regisztráció. Előbb regisztráljon az appba." };
  }
  revalidatePath("/kutya");
  return { message: "Társgazda hozzáadva." };
}

export async function removeMember(petId: string, userId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase.from("pet_members").delete().eq("pet_id", petId).eq("user_id", userId);
  revalidatePath("/", "layout");
  if (userId === user.id) {
    (await cookies()).delete(CURRENT_PET_COOKIE);
    redirect("/");
  }
}

export async function updateProfile(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: optional(formData, "full_name"),
      phone: optional(formData, "phone"),
      notifications_enabled: formData.get("notifications_enabled") === "on",
    })
    .eq("id", user.id);
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/tobb");
  return { message: "Elmentve." };
}

export async function updateMealTimes(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pets")
    .update({
      breakfast_time: String(formData.get("breakfast_time") || "08:00"),
      dinner_time: String(formData.get("dinner_time") || "18:00"),
    })
    .eq("id", String(formData.get("pet_id")));
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

export async function setAppearance(formData: FormData) {
  const store = await cookies();
  const options = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
  const theme = formData.get("theme");
  const accent = formData.get("accent");
  if (typeof theme === "string") store.set(THEME_COOKIE, parseTheme(theme), options);
  if (typeof accent === "string") store.set(ACCENT_COOKIE, parseAccent(accent), options);
  revalidatePath("/", "layout");
}
