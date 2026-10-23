"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { optional, required } from "@/lib/form";
import { parseTags } from "@/lib/documents";
import type { ActionResult } from "@/components/forms";

// Feltöltés előkészítése: aláírt feltöltési cím a kutya mappájába. A tároló
// szabályai csak a kutya gazdáinak engedik.
export async function prepareUpload(petId: string, fileName: string) {
  const safeName = fileName.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
  const path = `${petId}/${crypto.randomUUID()}-${safeName}`;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUploadUrl(path);
  if (error || !data) return { error: "Nem sikerült előkészíteni a feltöltést." };
  return { path: data.path, token: data.token };
}

export async function saveDocument(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    pet_id: required(fd, "pet_id"),
    title: required(fd, "title"),
    doc_type: required(fd, "doc_type"),
    document_date: required(fd, "document_date"),
    medical_event_id: optional(fd, "medical_event_id"),
    tags: parseTags(optional(fd, "tags")),
    storage_path: required(fd, "storage_path"),
    file_name: required(fd, "file_name"),
    mime_type: optional(fd, "mime_type"),
    size_bytes: Number(fd.get("size_bytes")) || null,
  });
  if (error) return { error: "Nem sikerült menteni a dokumentumot." };
  revalidatePath("/", "layout");
  return { message: "Dokumentum feltöltve." };
}

export async function deleteDocument(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("documents").delete().eq("id", id).select("storage_path").single();
  if (data) await supabase.storage.from("documents").remove([data.storage_path]);
  revalidatePath("/", "layout");
}
