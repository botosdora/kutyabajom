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
  const adoption = optional(formData, "adoption_date");
  if (adoption) await supabase.from("pets").update({ adoption_date: adoption }).eq("id", data);
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
      adoption_date: optional(formData, "adoption_date"),
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
    return {
      error:
        "Ezzel az e-mail címmel még nincs regisztráció. Kérj neki meghívót az app adminjától, és ha regisztrált, add hozzá itt.",
    };
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
    })
    .eq("id", user.id);
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/egyeb");
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

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: subscription.endpoint,
    p_p256dh: subscription.keys.p256dh,
    p_auth: subscription.keys.auth,
    p_user_agent: subscription.userAgent,
  });
  return { ok: !error };
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

export async function requestTestNotification() {
  const supabase = await createClient();
  const { error } = await supabase.from("notification_requests").insert({});
  return { ok: !error };
}

export async function updateNotificationSettings(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      notifications_enabled: formData.get("notifications_enabled") === "on",
      notify_doses: formData.get("notify_doses") === "on",
      notify_reminders: formData.get("notify_reminders") === "on",
      daily_reminder_time: String(formData.get("daily_reminder_time") || "08:00"),
    })
    .eq("id", user.id);
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/egyeb");
  return { message: "Elmentve." };
}

// Kutyafotó: aláírt feltöltési cím a nyilvános fotótárolóba.
export async function preparePetPhotoUpload(petId: string) {
  const path = `${petId}/${crypto.randomUUID()}.jpg`;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("pet-photos").createSignedUploadUrl(path);
  if (error || !data) return { error: "Nem sikerült előkészíteni a feltöltést." };
  return { path: data.path, token: data.token };
}

export async function setPetPhoto(petId: string, path: string | null) {
  const supabase = await createClient();
  const { data: pet } = await supabase.from("pets").select("photo_path").eq("id", petId).single();
  await supabase.from("pets").update({ photo_path: path }).eq("id", petId);
  if (pet?.photo_path && pet.photo_path !== path) await supabase.storage.from("pet-photos").remove([pet.photo_path]);
  revalidatePath("/", "layout");
}

export async function createInvite(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_invite", { p_note: optional(formData, "note") ?? undefined });
  if (error) return { error: "Nem sikerült meghívót készíteni. Meghívót csak az admin készíthet." };
  revalidatePath("/admin");
  return { message: "Meghívó elkészült." };
}

export async function deleteInvite(code: string) {
  const supabase = await createClient();
  await supabase.from("invites").delete().eq("code", code).is("used_by", null);
  revalidatePath("/admin");
}
