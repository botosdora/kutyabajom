import { CalendarPlus, CalendarRange, History, Pill, Play, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";
import { AddPanel, DeleteButton } from "@/components/forms";
import { MedicationDetailsForm, PeriodForm } from "@/components/medication-form";
import { SheetLauncher } from "@/components/sheet";
import { StopMedication } from "@/components/stop-medication";
import { buttonClass, Card, EmptyState, Field, PageHeader, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { budapestDay, formatDate, formatHuf, formatTime, todayIso } from "@/lib/format";
import {
  categoryLabel,
  describeRange,
  describeRhythm,
  DOSE_STATUS_LABELS,
  isCurrent,
  periodState,
  sortPeriods,
  stopReasonLabel,
} from "@/lib/medications";
import {
  addPeriod,
  addPurchase,
  deleteMedication,
  deletePeriod,
  deletePurchase,
  reactivateMedication,
  updateMedication,
  updatePeriod,
} from "../actions";

const STATE_BADGE = {
  running: { label: "Folyamatban", className: "bg-primary-soft text-link" },
  upcoming: { label: "Tervezett", className: "bg-surface-muted text-text" },
  ended: { label: "Véget ért", className: "bg-surface-muted text-text-muted" },
};

export default async function MedicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ uj?: string }>;
}) {
  const { id } = await params;
  const { uj } = await searchParams;
  const supabase = await createClient();
  const { data: med } = await supabase.from("medications").select("*, medication_periods(*)").eq("id", id).maybeSingle();
  if (!med) notFound();

  const [{ data: purchases }, { data: logs }] = await Promise.all([
    supabase.from("medication_purchases").select("*").eq("medication_id", id).order("purchased_on", { ascending: false }),
    supabase.from("dose_logs").select("*").eq("medication_id", id).order("scheduled_for", { ascending: false }).limit(30),
  ]);
  const today = todayIso();
  const totalCost = (purchases ?? []).reduce((sum, p) => sum + (p.cost_huf ?? 0), 0);
  const periods = sortPeriods(med.medication_periods);
  const current = isCurrent(med, periods, today);
  const latest = periods[periods.length - 1];
  const running = periods.find((p) => periodState(p, today) === "running");
  const isOnce = med.schedule_type === "once";
  const isCourse = med.schedule_type === "course";
  const hasOpen = periods.some((p) => !p.end_date || p.end_date >= today);

  // Az új időszak az előzőből töltődik ki: ugyanaz a ritmus és adag, kezdés ma.
  const defaults = latest
    ? { start_date: today, times: latest.times, interval_days: latest.interval_days, dosage: latest.dosage }
    : { start_date: today };
  const newLabel = isOnce ? "Új alkalom" : isCourse ? "Új kúra indítása" : "Újraindítás";
  const sectionTitle = isOnce ? "Alkalmak" : isCourse ? "Kúrák" : "Időszakok";
  const canAdd = isOnce || isCourse || !hasOpen;

  return (
    <>
      <PageHeader
        title={med.name}
        subtitle={`${categoryLabel(med.category)} · ${current ? "szedi" : "már nem szedi"}`}
        back={{ href: "/gyogyszerek", label: "Gyógyszerek" }}
        icon={Pill}
        action={
          <SheetLauncher title={`${med.name} szerkesztése`}>
            <MedicationDetailsForm action={updateMedication} medication={med} />
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-xs text-text-muted">Ha csak abbahagyta, használd a „Már nem szedi” gombot.</p>
              <DeleteButton
                action={deleteMedication.bind(null, med.id)}
                label="Törlés"
                confirmText="Biztosan törlöd? Az összes alkalom és vásárlás is törlődik."
              />
            </div>
          </SheetLauncher>
        }
      />

      <Card className="mb-4">
        <dl className="flex flex-col gap-3">
          {med.dosage && (
            <div>
              <dt className="text-xs font-semibold uppercase text-text-muted">Adag</dt>
              <dd className="font-medium">{running?.dosage ?? med.dosage}</dd>
            </div>
          )}
          {running && !isOnce && (
            <div>
              <dt className="text-xs font-semibold uppercase text-text-muted">Most</dt>
              <dd className="font-medium">
                {describeRhythm(running)}
                {running.end_date && <span className="text-text-muted"> · vége: {formatDate(running.end_date)}</span>}
              </dd>
            </div>
          )}
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

      <div className="mb-6 flex flex-wrap gap-2">
        {canAdd && (
          <SheetLauncher
            title={newLabel}
            label={newLabel}
            icon={isOnce ? <CalendarPlus size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            variant={current ? "secondary" : "primary"}
            defaultOpen={uj === "1"}
          >
            <PeriodForm action={addPeriod} medication={med} defaults={defaults} today={today} />
          </SheetLauncher>
        )}
        {current && <StopMedication medicationId={med.id} name={med.name} today={today} showReason={!isOnce} />}
        {!current && isOnce && (
          <form action={reactivateMedication.bind(null, med.id)}>
            <button type="submit" className={buttonClass("secondary")}>
              Újra szedi
            </button>
          </form>
        )}
      </div>

      <section className="mb-6">
        <SectionTitle icon={CalendarRange}>{sectionTitle}</SectionTitle>
        {periods.length ? (
          <ul className="flex flex-col gap-2">
            {[...periods].reverse().map((p) => {
              const state = STATE_BADGE[periodState(p, today)];
              const reason = stopReasonLabel(p.stop_reason);
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface py-2.5 pl-4 pr-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                      {describeRange(p)}
                      {!isOnce && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${state.className}`}>{state.label}</span>}
                    </p>
                    <p className="text-sm text-text-muted">
                      {isOnce ? p.times.map((t) => t.slice(0, 5)).join(", ") : describeRhythm(p)}
                      {p.dosage && ` · ${p.dosage}`}
                      {reason && ` · ${reason}`}
                    </p>
                  </div>
                  <SheetLauncher title={isOnce ? "Alkalom módosítása" : "Időszak módosítása"}>
                    <PeriodForm action={updatePeriod} medication={med} period={p} today={today} />
                    <div className="mt-6 flex justify-end border-t border-border pt-4">
                      <DeleteButton
                        action={deletePeriod.bind(null, p.id)}
                        label={isOnce ? "Alkalom törlése" : "Időszak törlése"}
                        confirmText="Biztosan törlöd? Az ehhez tartozó rögzített beadások nem látszanak többé a naplóban."
                      />
                    </div>
                  </SheetLauncher>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState>Nincs megadott időszak.</EmptyState>
        )}
      </section>

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
        <SectionTitle icon={History}>Legutóbbi beadások</SectionTitle>
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
    </>
  );
}
