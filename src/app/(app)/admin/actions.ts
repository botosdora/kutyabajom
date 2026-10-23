"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { getIsAdmin } from "@/lib/pets";
import type { ActionResult } from "@/components/forms";

export async function setSuspended(userId: string, suspended: boolean) {
  const supabase = await createClient();
  await supabase.rpc("admin_set_suspended", { p_user_id: userId, p_suspended: suspended });
  revalidatePath("/admin");
}

// A végleges törlést az admin-delete-user Edge Function végzi (emelt jogosultsággal
// törli a fájlokat és a fiókot); a hívó adminságát ott is ellenőrizzük.
export async function deleteUser(_: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await getIsAdmin())) return { error: "Csak az admin teheti meg." };
  const userId = String(fd.get("user_id"));
  if (String(fd.get("confirm") ?? "").trim().toLowerCase() !== String(fd.get("email")).toLowerCase()) {
    return { error: "A megerősítéshez írd be pontosan a felhasználó e-mail címét." };
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-delete-user`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.session?.access_token}`,
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { error: body.error ?? "A törlés nem sikerült." };
  revalidatePath("/admin");
  redirect(`/admin?torolve=${encodeURIComponent(String(fd.get("email")))}&kutya=${body.deletedPets}&fajl=${body.removedFiles}`);
}
