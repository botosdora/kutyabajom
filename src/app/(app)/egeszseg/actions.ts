"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { optional, optionalNumber, required } from "@/lib/form";
import type { ActionResult } from "@/components/forms";

const SAVE_ERROR = { error: "Nem sikerült menteni. Ellenőrizd a mezőket." };

// Minden kutyához tartozó adat a pet_id-vel együtt érkezik; a jogosultságot az
// adatbázis RLS szabályai ellenőrzik.
function done(path: string): ActionResult {
  revalidatePath("/", "layout");
  revalidatePath(path);
  return { message: "Elmentve." };
}

export async function addWeight(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const weight = optionalNumber(fd, "weight_kg");
  if (!weight || weight <= 0) return { error: "Adj meg egy érvényes súlyt." };
  const supabase = await createClient();
  const { error } = await supabase.from("weights").insert({
    pet_id: required(fd, "pet_id"),
    measured_on: required(fd, "measured_on"),
    weight_kg: weight,
    body_condition: optionalNumber(fd, "body_condition"),
    note: optional(fd, "note"),
  });
  return error ? SAVE_ERROR : done("/egeszseg/suly");
}

export async function addAllergy(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("allergies").insert({
    pet_id: required(fd, "pet_id"),
    name: required(fd, "name"),
    notes: optional(fd, "notes"),
  });
  return error ? SAVE_ERROR : done("/egeszseg/allergiak");
}

export async function addCondition(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("conditions").insert({
    pet_id: required(fd, "pet_id"),
    name: required(fd, "name"),
    diagnosed_on: optional(fd, "diagnosed_on"),
    notes: optional(fd, "notes"),
  });
  return error ? SAVE_ERROR : done("/egeszseg/allergiak");
}

export async function toggleCondition(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("conditions").update({ active }).eq("id", id);
  revalidatePath("/egeszseg/allergiak");
}

export async function addVet(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("vets").insert({
    pet_id: required(fd, "pet_id"),
    name: required(fd, "name"),
    clinic: optional(fd, "clinic"),
    specialty: optional(fd, "specialty"),
    phone: optional(fd, "phone"),
    email: optional(fd, "email"),
    address: optional(fd, "address"),
    notes: optional(fd, "notes"),
  });
  return error ? SAVE_ERROR : done("/egeszseg/orvosok");
}

export async function addVaccination(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("vaccinations").insert({
    pet_id: required(fd, "pet_id"),
    vaccinated_on: required(fd, "vaccinated_on"),
    vaccine: required(fd, "vaccine"),
    product_name: optional(fd, "product_name"),
    valid_until: optional(fd, "valid_until"),
    vet_id: optional(fd, "vet_id"),
    notes: optional(fd, "notes"),
  });
  return error ? SAVE_ERROR : done("/egeszseg/oltasok");
}

function medicalEventFields(fd: FormData) {
  return {
    event_date: required(fd, "event_date"),
    kind: required(fd, "kind"),
    title: required(fd, "title"),
    vet_id: optional(fd, "vet_id"),
    description: optional(fd, "description"),
  };
}

export async function addMedicalEvent(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const cost = optionalNumber(fd, "cost_huf");
  if (cost !== null && cost < 0) return { error: "A költség nem lehet negatív." };
  const supabase = await createClient();
  const fields = medicalEventFields(fd);
  const { data, error } = await supabase
    .from("medical_events")
    .insert({ pet_id: required(fd, "pet_id"), ...fields })
    .select("id")
    .single();
  if (error) return SAVE_ERROR;
  if (cost) await insertEventCost(supabase, data.id, required(fd, "pet_id"), fields.event_date, fields.title, cost);
  return done("/egeszseg/beavatkozasok");
}

// Költség egy orvosi eseményhez: a Költségek között Állatorvos kategóriában jelenik meg.
async function insertEventCost(
  supabase: Awaited<ReturnType<typeof createClient>>,
  medicalEventId: string,
  petId: string,
  spentOn: string,
  title: string,
  amount: number,
) {
  return supabase.from("expenses").insert({
    pet_id: petId,
    spent_on: spentOn,
    category: "allatorvos",
    amount_huf: Math.round(amount),
    title,
    medical_event_id: medicalEventId,
  });
}

export async function addMedicalEventCost(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const cost = optionalNumber(fd, "cost_huf");
  if (!cost || cost <= 0) return { error: "Adj meg egy érvényes összeget." };
  const supabase = await createClient();
  const id = required(fd, "medical_event_id");
  const { error } = await insertEventCost(
    supabase,
    id,
    required(fd, "pet_id"),
    required(fd, "spent_on"),
    optional(fd, "title") ?? required(fd, "event_title"),
    cost,
  );
  return error ? SAVE_ERROR : done(`/egeszseg/beavatkozasok/${id}`);
}

export async function deleteMedicalEventCost(expenseId: string, medicalEventId: string) {
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", expenseId);
  revalidatePath("/", "layout");
  revalidatePath(`/egeszseg/beavatkozasok/${medicalEventId}`);
}

export async function updateMedicalEvent(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id = required(fd, "id");
  const { error } = await supabase.from("medical_events").update(medicalEventFields(fd)).eq("id", id);
  return error ? SAVE_ERROR : done(`/egeszseg/beavatkozasok/${id}`);
}

type HealthTable = "weights" | "allergies" | "conditions" | "vets" | "vaccinations" | "medical_events";

export async function deleteRecord(table: HealthTable, id: string, path: string) {
  const supabase = await createClient();
  await supabase.from(table).delete().eq("id", id);
  revalidatePath("/", "layout");
  if (table === "medical_events" && path.includes("/beavatkozasok/")) redirect("/egeszseg/beavatkozasok");
  revalidatePath(path);
}
