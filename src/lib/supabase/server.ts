import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Componentből hívva nem lehet sütit írni; ezt a proxy pótolja.
          }
        },
      },
    },
  );
}
