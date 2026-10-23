"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { optional, optionalNumber, required } from "@/lib/form";
import { medicalKindFor, vetTypeLabel } from "@/lib/calendar";
import type { ActionResult } from "@/components/forms";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Az űrlap adatai; feladatnál szükség esetén új feladattípust is létrehoz.
async function eventFields(supabase: Supabase, fd: FormData, petId: string) {
  const category = required(fd, "category") === "feladat" ? "feladat" : "orvosi";
  let taskTypeId = category === "feladat" ? optional(fd, "task_type_id") : null;
  if (taskTypeId === "__new") taskTypeId = null;
  let typeName = "";

  const newType = optional(fd, "new_task_type");
  if (category === "feladat" && newType) {
    const { data } = await supabase
      .from("task_types")
      .upsert({ pet_id: petId, name: newType }, { onConflict: "pet_id,name" })
      .select("id, name")
      .single();
    taskTypeId = data?.id ?? null;
    typeName = data?.name ?? newType;
  } else if (taskTypeId) {
    const { data } = await supabase.from("task_types").select("name").eq("id", taskTypeId).single();
    typeName = data?.name ?? "";
  }

  const vetType = category === "orvosi" ? required(fd, "vet_type") : null;
  const title =
    optional(fd, "title") ?? (category === "orvosi" ? vetTypeLabel(vetType) : typeName || "Feladat");

  return {
    category,
    vet_type: vetType,
    task_type_id: taskTypeId,
    title,
    event_date: required(fd, "event_date"),
    event_time: optional(fd, "event_time"),
    vet_id: category === "orvosi" ? optional(fd, "vet_id") : null,
    location: optional(fd, "location"),
    notes: optional(fd, "notes"),
  };
}

export async function createEvent(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const petId = required(fd, "pet_id");
  if (!required(fd, "event_date")) return { error: "Add meg a dátumot." };
  const supabase = await createClient();
  const fields = await eventFields(supabase, fd, petId);
  const { error } = await supabase.from("calendar_events").insert({ pet_id: petId, ...fields });
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  redirect(`/naptar?nap=${fields.event_date}`);
}

export async function updateEvent(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const fields = await eventFields(supabase, fd, required(fd, "pet_id"));
  const { error } = await supabase.from("calendar_events").update(fields).eq("id", required(fd, "id"));
  if (error) return { error: "Nem sikerült menteni." };
  revalidatePath("/", "layout");
  return { message: "Elmentve." };
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  await supabase.from("calendar_events").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/naptar");
}

export async function reopenEvent(id: string) {
  const supabase = await createClient();
  await supabase.from("calendar_events").update({ status: "planned", completed_on: null }).eq("id", id);
  revalidatePath("/", "layout");
}

// Visszajelzés egy eseményről: megtörtént-e, és ha igen, a részletek. Orvosi
// eseménynél bekerül az orvosi beavatkozások közé (oltásnál az oltások közé),
// a költség pedig a költségek közé.
export async function completeEvent(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: event } = await supabase.from("calendar_events").select("*").eq("id", required(fd, "id")).single();
  if (!event) return { error: "Az esemény nem található." };

  if (required(fd, "outcome") === "missed") {
    await supabase.from("calendar_events").update({ status: "missed", completed_on: null }).eq("id", event.id);
    revalidatePath("/", "layout");
    return { message: "Elmaradtként rögzítve." };
  }

  const completedOn = required(fd, "completed_on") || event.event_date;
  const description = optional(fd, "description");
  let medicalEventId: string | null = event.medical_event_id;
  let vaccinationId: string | null = event.vaccination_id;

  if (event.category === "orvosi" && event.vet_type === "oltas" && !vaccinationId) {
    const product = optional(fd, "product_name");
    if (!product) return { error: "Add meg a kapott oltóanyag nevét." };
    const { data, error } = await supabase
      .from("vaccinations")
      .insert({
        pet_id: event.pet_id,
        vaccinated_on: completedOn,
        vaccine: event.title,
        product_name: product,
        valid_until: optional(fd, "valid_until"),
        vet_id: event.vet_id,
        notes: description,
      })
      .select("id")
      .single();
    if (error) return { error: "Nem sikerült menteni az oltást." };
    vaccinationId = data.id;
  } else if (event.category === "orvosi" && !medicalEventId) {
    const { data, error } = await supabase
      .from("medical_events")
      .insert({
        pet_id: event.pet_id,
        event_date: completedOn,
        kind: medicalKindFor(event.vet_type),
        title: event.title,
        vet_id: event.vet_id,
        description: [description, event.notes].filter(Boolean).join("\n\n") || null,
      })
      .select("id")
      .single();
    if (error) return { error: "Nem sikerült menteni az orvosi eseményt." };
    medicalEventId = data.id;
  }

  const cost = optionalNumber(fd, "cost_huf");
  if (cost && cost > 0) {
    await supabase.from("expenses").insert({
      pet_id: event.pet_id,
      spent_on: completedOn,
      category: required(fd, "cost_category") || (event.category === "orvosi" ? "allatorvos" : "terapia"),
      amount_huf: Math.round(cost),
      title: event.title,
      medical_event_id: medicalEventId,
      calendar_event_id: event.id,
    });
  }

  await supabase
    .from("calendar_events")
    .update({
      status: "done",
      completed_on: completedOn,
      medical_event_id: medicalEventId,
      vaccination_id: vaccinationId,
    })
    .eq("id", event.id);

  revalidatePath("/", "layout");
  // Vizsgálat után a beavatkozás oldalán csatolható a kórlap vagy a lelet.
  if (medicalEventId && !event.medical_event_id) redirect(`/egeszseg/beavatkozasok/${medicalEventId}?uj=1`);
  return { message: "Rögzítve." };
}
