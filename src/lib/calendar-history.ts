import "server-only";
import type { EventRowData } from "@/components/event-row";
import { eventKindLabel } from "@/lib/health";
import { createClient } from "@/lib/supabase/server";

// A naptáron kívül felvett orvosi beavatkozások és oltások naptárbeli megjelenítéshez.
// Ami naptáreseményből lett rögzítve, azt kihagyjuk (az a naptáreseményként látszik).
export async function getMedicalHistoryEvents(petId: string, from: string, to: string): Promise<EventRowData[]> {
  const supabase = await createClient();
  const [{ data: linked }, { data: medical }, { data: vaccines }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("medical_event_id, vaccination_id")
      .eq("pet_id", petId)
      .or("medical_event_id.not.is.null,vaccination_id.not.is.null"),
    supabase.from("medical_events").select("id, title, kind, event_date").eq("pet_id", petId).gte("event_date", from).lte("event_date", to),
    supabase.from("vaccinations").select("id, vaccine, product_name, vaccinated_on").eq("pet_id", petId).gte("vaccinated_on", from).lte("vaccinated_on", to),
  ]);
  const linkedMedical = new Set((linked ?? []).map((l) => l.medical_event_id).filter(Boolean));
  const linkedVaccines = new Set((linked ?? []).map((l) => l.vaccination_id).filter(Boolean));
  return [
    ...(medical ?? [])
      .filter((m) => !linkedMedical.has(m.id))
      .map((m) => ({
        id: `m-${m.id}`,
        category: "orvosi",
        vet_type: null,
        title: m.title,
        event_date: m.event_date,
        event_time: null,
        status: "done",
        href: `/egeszseg/beavatkozasok/${m.id}`,
        typeLabel: eventKindLabel(m.kind),
      })),
    ...(vaccines ?? [])
      .filter((v) => !linkedVaccines.has(v.id))
      .map((v) => ({
        id: `v-${v.id}`,
        category: "orvosi",
        vet_type: "oltas",
        title: v.product_name ? `${v.vaccine} (${v.product_name})` : v.vaccine,
        event_date: v.vaccinated_on,
        event_time: null,
        status: "done",
        href: "/egeszseg/oltasok",
        typeLabel: "Oltás",
      })),
  ];
}
