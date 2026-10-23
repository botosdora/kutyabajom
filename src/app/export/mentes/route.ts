import type { NextRequest } from "next/server";
import { strToU8, zipSync, type Zippable } from "fflate";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/pets";
import { todayIso } from "@/lib/format";

// Teljes adatmentés: minden kutya minden adata egy JSON fájlban, kérésre a
// feltöltött dokumentumokkal és fotókkal együtt, egy ZIP-ben.
export const maxDuration = 60;

const PET_TABLES = [
  "weights",
  "allergies",
  "conditions",
  "vets",
  "vaccinations",
  "medical_events",
  "medications",
  "dose_logs",
  "medication_purchases",
  "meal_logs",
  "task_types",
  "calendar_events",
  "documents",
  "expenses",
  "daily_logs",
  "foods",
  "food_purchases",
  "lab_results",
] as const;

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const withFiles = request.nextUrl.searchParams.get("fajlokkal") === "1";
  const supabase = await createClient();

  const [{ data: profile }, { data: pets }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("pets").select("*").order("created_at"),
  ]);
  const petIds = (pets ?? []).map((p) => p.id);

  const tables: Record<string, unknown[]> = {};
  await Promise.all(
    PET_TABLES.map(async (table) => {
      const { data } = await supabase.from(table).select("*").in("pet_id", petIds);
      tables[table] = data ?? [];
    }),
  );

  const backup = {
    app: "Kutyabajom",
    format: 1,
    exported_at: new Date().toISOString(),
    profile,
    pets,
    ...tables,
  };

  const zip: Zippable = { "adatok.json": strToU8(JSON.stringify(backup, null, 2)) };

  if (withFiles) {
    const docs = tables.documents as { storage_path: string; file_name: string }[];
    for (const doc of docs) {
      const { data } = await supabase.storage.from("documents").download(doc.storage_path);
      if (data) zip[`dokumentumok/${doc.storage_path}`] = new Uint8Array(await data.arrayBuffer());
    }
    for (const pet of pets ?? []) {
      if (!pet.photo_path) continue;
      const { data } = await supabase.storage.from("pet-photos").download(pet.photo_path);
      if (data) zip[`fotok/${pet.photo_path}`] = new Uint8Array(await data.arrayBuffer());
    }
  }

  const archive = zipSync(zip, { level: 6 });
  return new Response(new Uint8Array(archive), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="kutyabajom-mentes-${todayIso()}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
