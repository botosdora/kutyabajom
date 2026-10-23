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

// Testkondíció-pontszám (BCS, 1–9 skála).
export const BCS_OPTIONS = [
  { value: "", label: "–" },
  { value: "1", label: "1 – nagyon sovány" },
  { value: "2", label: "2 – sovány" },
  { value: "3", label: "3 – sovány" },
  { value: "4", label: "4 – ideális" },
  { value: "5", label: "5 – ideális" },
  { value: "6", label: "6 – enyhén túlsúlyos" },
  { value: "7", label: "7 – túlsúlyos" },
  { value: "8", label: "8 – elhízott" },
  { value: "9", label: "9 – erősen elhízott" },
];

export function bcsInfo(score: number) {
  if (score <= 3) return { label: "Sovány", badge: "bg-warning-soft text-warning" };
  if (score <= 5) return { label: "Ideális", badge: "bg-success-soft text-success" };
  if (score <= 7) return { label: "Túlsúlyos", badge: "bg-warning-soft text-warning" };
  return { label: "Elhízott", badge: "bg-danger-soft text-danger" };
}
