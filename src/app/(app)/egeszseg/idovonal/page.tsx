import { History } from "lucide-react";
import { HealthTimeline, type TimelineEntry } from "@/components/health-timeline";
import { EmptyState, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { docTypeLabel } from "@/lib/documents";
import { formatWeight } from "@/lib/format";
import { eventKindLabel } from "@/lib/health";
import { requireCurrentPet } from "@/lib/pets";

export const metadata = { title: "Egészség-idővonal" };

export default async function HealthTimelinePage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const [{ data: events }, { data: vaccines }, { data: weights }, { data: labs }, { data: docs }, { data: conditions }] =
    await Promise.all([
      supabase.from("medical_events").select("id, event_date, kind, title, description").eq("pet_id", pet.id),
      supabase.from("vaccinations").select("id, vaccinated_on, vaccine, product_name, valid_until").eq("pet_id", pet.id),
      supabase.from("weights").select("id, measured_on, weight_kg, body_condition").eq("pet_id", pet.id).order("measured_on"),
      supabase.from("lab_results").select("measured_on, value, ref_low, ref_high").eq("pet_id", pet.id),
      supabase.from("documents").select("id, document_date, title, doc_type").eq("pet_id", pet.id),
      supabase.from("conditions").select("id, diagnosed_on, name, active").eq("pet_id", pet.id).not("diagnosed_on", "is", null),
    ]);

  const entries: TimelineEntry[] = [];
  if (pet.birth_date) entries.push({ key: "birth", date: pet.birth_date, kind: "milestone", title: `${pet.name} megszületett`, detail: pet.breed, href: "/kutya" });
  if (pet.adoption_date) entries.push({ key: "adoption", date: pet.adoption_date, kind: "milestone", title: "Hozzánk került", detail: null, href: "/kutya" });

  for (const e of events ?? []) {
    entries.push({ key: `e-${e.id}`, date: e.event_date, kind: "medical", title: e.title, detail: eventKindLabel(e.kind), href: `/egeszseg/beavatkozasok/${e.id}` });
  }
  for (const v of vaccines ?? []) {
    entries.push({
      key: `v-${v.id}`,
      date: v.vaccinated_on,
      kind: "vaccine",
      title: `${v.vaccine} oltás`,
      detail: v.product_name,
      href: "/egeszseg/oltasok",
    });
  }
  // Súly: a változás az előző méréshez képest.
  (weights ?? []).forEach((w, i, all) => {
    const prev = i > 0 ? Number(all[i - 1].weight_kg) : null;
    const diff = prev === null ? null : Number(w.weight_kg) - prev;
    const change = diff === null || Math.abs(diff) < 0.05 ? null : `${diff > 0 ? "+" : "−"}${formatWeight(Math.abs(diff))}`;
    entries.push({
      key: `w-${w.id}`,
      date: w.measured_on,
      kind: "weight",
      title: `Súlymérés: ${formatWeight(Number(w.weight_kg))}`,
      detail: [change, w.body_condition && `BCS ${w.body_condition}/9`].filter(Boolean).join(" · ") || null,
      href: "/egeszseg/suly",
    });
  });
  // Laborértékek naponként összevonva.
  const labDays = new Map<string, { count: number; out: number }>();
  for (const l of labs ?? []) {
    const d = labDays.get(l.measured_on) ?? { count: 0, out: 0 };
    d.count += 1;
    const v = Number(l.value);
    if ((l.ref_low !== null && v < Number(l.ref_low)) || (l.ref_high !== null && v > Number(l.ref_high))) d.out += 1;
    labDays.set(l.measured_on, d);
  }
  for (const [day, d] of labDays) {
    entries.push({
      key: `l-${day}`,
      date: day,
      kind: "lab",
      title: "Laborvizsgálat",
      detail: `${d.count} érték${d.out ? ` · ${d.out} a tartományon kívül` : " · mind a tartományon belül"}`,
      href: "/egeszseg/labor",
    });
  }
  for (const doc of docs ?? []) {
    entries.push({ key: `d-${doc.id}`, date: doc.document_date, kind: "document", title: doc.title, detail: docTypeLabel(doc.doc_type), href: "/egeszseg/dokumentumok" });
  }
  for (const c of conditions ?? []) {
    entries.push({
      key: `c-${c.id}`,
      date: c.diagnosed_on!,
      kind: "condition",
      title: `Diagnózis: ${c.name}`,
      detail: c.active ? "Jelenleg is fennáll" : "Már nem áll fenn",
      href: "/egeszseg/allergiak",
    });
  }
  entries.sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key));

  return (
    <>
      <PageHeader
        title="Egészség-idővonal"
        subtitle={pet.name}
        back={{ href: "/egeszseg", label: "Egészség" }}
        icon={History}
      />
      {entries.length ? (
        <HealthTimeline entries={entries} />
      ) : (
        <EmptyState>Még nincs rögzített egészségügyi esemény.</EmptyState>
      )}
    </>
  );
}
