"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/components/forms";

function translateAuthError(message: string) {
  if (message.includes("Invalid login credentials")) return "Hibás e-mail cím vagy jelszó.";
  if (message.includes("Email not confirmed"))
    return "Először erősítsd meg az e-mail címed a neked küldött levélben.";
  if (message.includes("already registered")) return "Ezzel az e-mail címmel már regisztráltak.";
  if (message.toLowerCase().includes("password")) return "A jelszó legalább 8 karakter legyen.";
  if (message.toLowerCase().includes("rate limit"))
    return "Túl sok próbálkozás. Várj néhány percet, és próbáld újra.";
  return "Valami hiba történt. Próbáld újra.";
}

export async function login(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) return { error: translateAuthError(error.message) };
  redirect("/");
}

export async function signup(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password"));
  if (password.length < 8) return { error: "A jelszó legalább 8 karakter legyen." };
  if (password !== formData.get("password2")) return { error: "A két jelszó nem egyezik." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password,
    options: { data: { full_name: String(formData.get("full_name")).trim() } },
  });
  if (error) return { error: translateAuthError(error.message) };
  return {
    message: "Küldtünk egy megerősítő e-mailt. Kattints a benne lévő linkre, és már be is léphetsz.",
  };
}

export async function requestPasswordReset(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(String(formData.get("email")));
  if (error) return { error: translateAuthError(error.message) };
  return { message: "Ha létezik ilyen fiók, küldtünk egy levelet az új jelszó beállításához." };
}

export async function updatePassword(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password"));
  if (password.length < 8) return { error: "A jelszó legalább 8 karakter legyen." };
  if (password !== formData.get("password2")) return { error: "A két jelszó nem egyezik." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: translateAuthError(error.message) };
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/belepes");
}
