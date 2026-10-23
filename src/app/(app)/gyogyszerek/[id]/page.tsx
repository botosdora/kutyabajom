import { History, Pill, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";
import { AddPanel, DeleteButton } from "@/components/forms";
import { MedicationForm } from "@/components/medication-form";
import { buttonClass, Card, EmptyState, Field, PageHeader, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { budapestDay, formatDate, formatHuf, formatTime, todayIso } from "@/lib/format";
import { categoryLabel, describeSchedule, DOSE_STATUS_LABELS, MED_CATEGORIES } from "@/lib/medications";
import { addPurchase, deleteMedication, deletePurchase, setMedicationActive, updateMedication } from "../actions";

export default async function MedicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: med } = await supabase.from("medications").select("*").eq("id", id).maybeSingle();
  if (!med) notFound();

  const [{ data: purchases }, { data: logs }] = await Promise.all([
    supabase
      .from("medication_purchases")
      .select("*")
      .eq("medication_id", id)
      .order("purchased_on", { ascending: false }),
    supabase
      .from("dose_logs")
      .select("*")
      .eq("medication_id", id)
      .order("scheduled_for", { ascending: false })
      .limit(30),
  ]);
  const today = todayIso();
  const totalCost = (purchases ?? []).reduce((sum, p) => sum + (p.cost_huf ?? 0), 0);

  return (
    <>
      <PageHeader
        title={med.name}
        subtitle={`${categoryLabel(med.category)}${med.active ? "" : " · nem szedi"}`}
        back={{ href: "/gyogyszerek", label: "Gyógyszerek" }}
        icon={Pill}
      />

      <Card className="mb-6">
        <dl className="flex flex-col gap-3">
          {med.dosage && (
            <div>
              <dt className="text-xs font-semibold uppercase text-text-muted">Adag</dt>
              <dd className="font-medium">{med.dosage}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold uppercase text-text-muted">Ütemezés</dt>
            <dd className="font-medium">{describeSchedule(med)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-text-muted">Újravásárlás</dt>
            <dd className="font-medium">{formatDate(med.reorder_on)}</dd>
          </div>
          {med.notes && (
            <div>
              <dt className="text-xs font-semibold uppercase text-text-muted">Megjegyzés</dt>
              <dd className="whitespace-pre-line">{med.notes}</dd>
            </div>
          )}
        </dl>
      </Card>

      <details className="mb-6 rounded-2xl border border-border bg-surface">
        <summary className="cursor-pointer px-4 py-3 font-semibold">Szerkesztés</summary>
        <div className="px-4 pb-4">
          <MedicationForm
            action={updateMedication}
            petId={med.pet_id}
            medication={med}
            categories={MED_CATEGORIES}
            today={today}
          />
        </div>
      </details>

      <section className="mb-6">
        <SectionTitle icon={ShoppingBag} action={totalCost > 0 && <span className="text-sm text-text-muted">Összesen: {formatHuf(totalCost)}</span>}>
          Vásárlások
        </SectionTitle>
        {purchases?.length ? (
          <ul className="mb-3 divide-y divide-border rounded-2xl border border-border bg-surface">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2 pl-4 pr-2">
                <div className="flex-1">
                  <p className="font-semibold">
                    {formatDate(p.purchased_on)}
                    {p.cost_huf !== null && <span className="font-normal"> · {formatHuf(p.cost_huf)}</span>}
                  </p>
                  {(p.quantity || p.notes) && (
                    <p className="text-sm text-text-muted">{[p.quantity, p.notes].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <DeleteButton action={deletePurchase.bind(null, p.id)} />
              </li>
            ))}
          </ul>
        ) : null}
        <AddPanel label="Vásárlás rögzítése" action={addPurchase}>
          <input type="hidden" name="medication_id" value={med.id} />
          <input type="hidden" name="pet_id" value={med.pet_id} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dátum" name="purchased_on" type="date" defaultValue={today} required />
            <Field label="Ár (Ft)" name="cost_huf" type="number" min={0} inputMode="numeric" />
          </div>
          <Field label="Mennyiség" name="quantity" placeholder="pl. 3 db tabletta" />
          <Field label="Következő újravásárlás" name="reorder_on" type="date" hint="Ha megadod, frissül az emlékeztető." />
        </AddPanel>
      </section>

      <section className="mb-8">
        <SectionTitle icon={History}>Legutóbbi alkalmak</SectionTitle>
        {logs?.length ? (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>
                  {formatDate(budapestDay(l.scheduled_for))} · {formatTime(l.scheduled_for)}
                </span>
                <span className={l.status === "given" ? "font-medium text-success" : "font-medium text-danger"}>
                  {DOSE_STATUS_LABELS[l.status]}
                  {l.status === "given" && l.given_at && ` ${formatTime(l.given_at)}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Az alkalmakat a főoldalon pipálhatod ki.</EmptyState>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <form action={setMedicationActive.bind(null, med.id, !med.active)}>
          <button type="submit" className={buttonClass("secondary")}>
            {med.active ? "Már nem szedi" : "Újra szedi"}
          </button>
        </form>
        <DeleteButton
          action={deleteMedication.bind(null, med.id)}
          label="Törlés"
          confirmText="Biztosan törlöd? Az összes alkalom és vásárlás is törlődik. Ha csak abbahagyta, használd a „Már nem szedi” gombot."
        />
      </div>
    </>
  );
}
