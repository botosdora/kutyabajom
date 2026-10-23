import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/env";

export const CURRENT_PET_COOKIE = "kutya";

// Egy kérésen belül csak egyszer kérdezzük le a felhasználót és a kutyákat.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/belepes");
  return user;
}

export const getPets = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("pets").select("*").order("created_at");
  return data ?? [];
});

// Az éppen kiválasztott kutya (sütiben tároljuk); ha nincs, az első.
export const getCurrentPet = cache(async () => {
  const pets = await getPets();
  const selected = (await cookies()).get(CURRENT_PET_COOKIE)?.value;
  return pets.find((p) => p.id === selected) ?? pets[0] ?? null;
});

export async function requireCurrentPet() {
  const pet = await getCurrentPet();
  if (!pet) redirect("/kutyak/uj");
  return pet;
}

// A kutyafotó nyilvános címe (véletlen fájlnévvel, így nem kitalálható).
export function petPhotoUrl(path: string | null) {
  return path ? `${supabaseUrl}/storage/v1/object/public/pet-photos/${path}` : null;
}

export const getIsAdmin = cache(async () => {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return data?.is_admin ?? false;
});
