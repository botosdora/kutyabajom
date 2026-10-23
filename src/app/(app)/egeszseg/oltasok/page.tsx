import { CalendarCheck, History, Syringe, UserRound } from "lucide-react";
import { AddPanel, DeleteButton } from "@/components/forms";
import { EmptyState, Field, LoadMore, PageHeader, pageLimit, SectionTitle, Select, TextArea } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, formatDate, todayIso } from "@/lib/format";
import { getVets, vetOptions } from "@/lib/health";
import { requireCurrentPet } from "@/lib/pets";
import { addVaccination, deleteRecord } from "../actions";

export const metadata = { title: "Oltások" };

type Vaccination = {
  id: string;
  vaccine: string;
  product_name: string | null;
  vaccinated_on: string;
  valid_until: string | null;
  notes: string | null;
  vets: { name: string } | null;
};

function validity(v: Vaccination, today: string) {
  if (!v.valid_until) return { label: "Nincs lejárat megadva", badge: "bg-surface-muted text-text-muted", days: null, pct: null };
  const left = daysBetween(today, v.valid_until);
  const span = Math.max(1, daysBetween(v.vaccinated_on, v.valid_until));
  const pct = Math.min(100, Math.max(0, (daysBetween(v.vaccinated_on, today) / span) * 100));
  if (left < 0) return { label: "Lejárt", badge: "bg-danger-soft text-danger", days: left, pct: 100 };
  if (left <= 30) return { label: "Hamarosan lejár", badge: "bg-warning-soft text-warning", days: left, pct };
  return { label: "Érvényes", badge: "bg-success-soft text-success", days: left, pct };
}

function VaccineCard({ v, today }: { v: Vaccination; today: string }) {
  const state = validity(v, today);
  const barColor = state.label === "Lejárt" ? "var(--danger)" : state.label === "Hamarosan lejár" ? "var(--warning)" : "var(--success)";
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-link">
          <Syringe size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-tight">{v.vaccine}</p>
          {v.product_name && <p className="text-sm text-text-muted">{v.product_name}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${state.badge}`}>{state.label}</span>
      </div>

      {state.pct !== null && (
        <div className="mt-4">
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${state.pct}%`, background: barColor }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-text-muted">
            <span>{formatDate(v.vaccinated_on)}</span>
            <span className="font-semibold text-text">
              {state.days! < 0 ? `${-state.days!} napja lejárt` : state.days === 0 ? "Ma jár le" : `Még ${state.days} nap`}
            </span>
            <span>{formatDate(v.valid_until)}</span>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
        <span className="flex items-center gap-1.5">
          <CalendarCheck size={15} aria-hidden="true" /> Beadva: {formatDate(v.vaccinated_on)}
        </span>
        {v.vets?.name && (
          <span className="flex items-center gap-1.5">
            <UserRound size={15} aria-hidden="true" /> {v.vets.name}
          </span>
        )}
        <span className="ml-auto">
          <DeleteButton action={deleteRecord.bind(null, "vaccinations", v.id, "/egeszseg/oltasok")} />
        </span>
      </div>
      {v.notes && <p className="mt-2 rounded-xl bg-surface-muted px-3 py-2 text-sm">{v.notes}</p>}
    </li>
  );
}

export default async function VaccinationsPage({ searchParams }: { searchParams: Promise<{ db?: string }> }) {
  const pet = await requireCurrentPet();
  const limit = pageLimit((await searchParams).db);
  const supabase = await createClient();
  const [{ data }, vets] = await Promise.all([
    supabase
      .from("vaccinations")
      .select("id, vaccine, product_name, vaccinated_on, valid_until, notes, vets(name)")
      .eq("pet_id", pet.id)
      .order("vaccinated_on", { ascending: false }),
    getVets(pet.id),
  ]);
  const today = todayIso();
  const all = (data ?? []) as Vaccination[];

  // Oltásfajtánként a legutóbbi az aktuális, a többi a korábbiak közé kerül.
  const seen = new Set<string>();
  const current: Vaccination[] = [];
  const history: Vaccination[] = [];
  for (const v of all) {
    const key = v.vaccine.trim().toLowerCase();
    (seen.has(key) ? history : current).push(v);
    seen.add(key);
  }

  return (
    <>
      <PageHeader title="Oltások" subtitle={pet.name} back={{ href: "/egeszseg", label: "Egészség" }} icon={Syringe} />

      <div className="mb-6">
        <AddPanel label="Új oltás" action={addVaccination}>
          <input type="hidden" name="pet_id" value={pet.id} />
          <Field label="Oltás" name="vaccine" placeholder="pl. veszettség, kombinált" required />
          <Field label="Készítmény neve" name="product_name" placeholder="pl. Nobivac DHPPi" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Beadás napja" name="vaccinated_on" type="date" defaultValue={today} required />
            <Field label="Érvényes eddig" name="valid_until" type="date" />
          </div>
          <Select label="Orvos" name="vet_id" options={vetOptions(vets)} />
          <TextArea label="Megjegyzés" name="notes" />
        </AddPanel>
      </div>

      {current.length === 0 ? (
        <EmptyState>Még nincs rögzített oltás.</EmptyState>
      ) : (
        <section className="mb-6">
          <SectionTitle icon={CalendarCheck}>Aktuális oltások</SectionTitle>
          <ul className="flex flex-col gap-3">
            {current.map((v) => (
              <VaccineCard key={v.id} v={v} today={today} />
            ))}
          </ul>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <SectionTitle icon={History}>Korábbi oltások</SectionTitle>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {history.slice(0, limit).map((v) => (
              <li key={v.id} className="flex items-center gap-3 py-2.5 pl-4 pr-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {v.vaccine}
                    {v.product_name && <span className="font-normal text-text-muted"> · {v.product_name}</span>}
                  </p>
                  <p className="text-sm text-text-muted">
                    {formatDate(v.vaccinated_on)}
                    {v.valid_until && ` – ${formatDate(v.valid_until)}`}
                  </p>
                </div>
                <DeleteButton action={deleteRecord.bind(null, "vaccinations", v.id, "/egeszseg/oltasok")} />
              </li>
            ))}
          </ul>
          <LoadMore shown={Math.min(limit, history.length)} total={history.length} href={(n) => `/egeszseg/oltasok?db=${n}`} />
        </section>
      )}
    </>
  );
}
