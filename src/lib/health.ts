import "server-only";
import { createClient } from "@/lib/supabase/server";

export const EVENT_KINDS = [
  { value: "vizsgalat", label: "Vizsgálat" },
  { value: "mutet", label: "Műtét" },
  { value: "kezeles", label: "Kezelés" },
  { value: "egyeb", label: "Egyéb" },
];

export function eventKindLabel(kind: string) {
  return EVENT_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

export async function getVets(petId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("vets").select("*").eq("pet_id", petId).order("name");
  return data ?? [];
}

export async function getWeights(petId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weights")
    .select("*")
    .eq("pet_id", petId)
    .order("measured_on", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export function vetOptions(vets: { id: string; name: string; clinic: string | null }[]) {
  return [
    { value: "", label: "–" },
    ...vets.map((v) => ({ value: v.id, label: v.clinic ? `${v.name} (${v.clinic})` : v.name })),
  ];
}
