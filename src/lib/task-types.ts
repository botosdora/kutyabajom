import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getTaskTypeOptions(petId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("task_types").select("id, name").eq("pet_id", petId).order("name");
  return (data ?? []).map((t) => ({ value: t.id, label: t.name }));
}
