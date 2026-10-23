// Felhasználó végleges törlése (csak admin hívhatja). A közös kutyák a többi
// gazdánál maradnak; azok a kutyák, amelyeknek ő az egyetlen gazdája, minden
// adatukkal és feltöltött fájljukkal együtt törlődnek.
import postgres from "npm:postgres@3.4.5";
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 1 });

function serviceKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
  return keys.default ?? Object.values(keys)[0];
}

// A JWT-t az Edge Functions átjáró már ellenőrizte; innen csak a felhasználó azonosítója kell.
function callerId(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const caller = callerId(req);
  if (!caller) return Response.json({ error: "Nincs bejelentkezve" }, { status: 401 });
  const [profile] = await sql`select is_admin from public.profiles where id = ${caller}`;
  if (!profile?.is_admin) return Response.json({ error: "Csak az admin teheti meg" }, { status: 403 });

  const { userId } = await req.json().catch(() => ({}));
  if (typeof userId !== "string") return Response.json({ error: "Hiányzó felhasználó" }, { status: 400 });
  if (userId === caller) return Response.json({ error: "Saját magadat nem törölheted" }, { status: 400 });

  const pets = await sql<{ pet_id: string }[]>`
    select m.pet_id from public.pet_members m
    where m.user_id = ${userId}
      and not exists (select 1 from public.pet_members o where o.pet_id = m.pet_id and o.user_id <> ${userId})`;
  const petIds = pets.map((p) => p.pet_id);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey(), { auth: { persistSession: false } });
  let removedFiles = 0;
  if (petIds.length) {
    const objects = await sql<{ bucket_id: string; name: string }[]>`
      select bucket_id, name from storage.objects
      where bucket_id in ('documents', 'pet-photos') and (storage.foldername(name))[1] = any(${petIds})`;
    for (const bucket of ["documents", "pet-photos"]) {
      const names = objects.filter((o) => o.bucket_id === bucket).map((o) => o.name);
      for (let i = 0; i < names.length; i += 100) {
        const { error } = await admin.storage.from(bucket).remove(names.slice(i, i + 100));
        if (error) return Response.json({ error: `Fájltörlési hiba: ${error.message}` }, { status: 500 });
        removedFiles += Math.min(100, names.length - i);
      }
    }
    await sql`delete from public.pets where id = any(${petIds})`;
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return Response.json({ error: `Felhasználó törlése sikertelen: ${error.message}` }, { status: 500 });
  return Response.json({ deletedPets: petIds.length, removedFiles });
});
