"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { optional, required } from "@/lib/form";
import type { ActionResult } from "@/components/forms";

function num(value: FormDataEntryValue | undefined) {
  const s = String(value ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Egy lelet több értéke egyszerre: a sorok mezői azonos néven, sorrendben érkeznek.
export async function addLabResults(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const params = fd.getAll("parameter").map((p) => String(p).trim());
  const values = fd.getAll("value");
  const units = fd.getAll("unit");
  const lows = fd.getAll("ref_low");
  const highs = fd.getAll("ref_high");

  const rows = params
    .map((parameter, i) => ({
      parameter,
      value: num(values[i]),
      unit: String(units[i] ?? "").trim() || null,
      ref_low: num(lows[i]),
      ref_high: num(highs[i]),
    }))
    .filter((r) => r.parameter && r.value !== null);
  if (rows.length === 0) return { error: "Adj meg legalább egy értéket." };

  const supabase = await createClient();
  const { error } = await supabase.from("lab_results").insert(
    rows.map((r) => ({
      ...r,
      value: r.value!,
      pet_id: required(fd, "pet_id"),
      measured_on: required(fd, "measured_on"),
      medical_event_id: optional(fd, "medical_event_id"),
    })),
  );
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/egeszseg", "layout");
  return { message: `${rows.length} érték elmentve.` };
}

export async function deleteLabResult(id: string) {
  const supabase = await createClient();
  await supabase.from("lab_results").delete().eq("id", id);
  revalidatePath("/egeszseg", "layout");
}
