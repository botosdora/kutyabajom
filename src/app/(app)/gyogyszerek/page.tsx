import Link from "next/link";
import { Bug, ChevronRight, FileDown, Leaf, Pill } from "lucide-react";
import { ButtonLink, EmptyState, GroupCard, PageHeader, Tabs } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, formatShortDate, inDaysLabel, todayIso } from "@/lib/format";
import {
  categoryLabel,
  currentDosage,
  describeSchedule,
  isCurrent,
  MED_CATEGORIES,
  sortPeriods,
  stopReasonLabel,
  type MedicationWithPeriods,
} from "@/lib/medications";
import { requireCurrentPet } from "@/lib/pets";

export const metadata = { title: "Gyógyszerek" };

const CATEGORY_ICONS: Record<string, typeof Pill> = { gyogyszer: Pill, feregtelenites: Bug, kiegeszito: Leaf };

function MedicationRow({ med, today }: { med: MedicationWithPeriods; today: string }) {
  const reorderDays = med.reorder_on ? daysBetween(today, med.reorder_on) : null;
  const dosage = currentDosage(med, med.medication_periods, today);
  return (
    <li>
      <Link
        href={`/gyogyszerek/${med.id}`}
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-muted"
      >
        <span className="flex-1">
          <span className="block font-semibold">
            {med.name}
            {dosage && <span className="font-normal text-text-muted"> · {dosage}</span>}
          </span>
          <span className="block text-sm text-text-muted">{describeSchedule(med, med.medication_periods, today)}</span>
          {reorderDays !== null && reorderDays <= 7 && (
            <span className="mt-0.5 block text-sm font-medium text-warn-text">Újravásárlás: {inDaysLabel(reorderDays)}</span>
          )}
        </span>
        <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

// Korábbi gyógyszer: mettől meddig szedte, miért hagyta abba, és gyors újraindítás.
function PastMedicationCard({ med }: { med: MedicationWithPeriods }) {
  const periods = sortPeriods(med.medication_periods);
  const first = periods[0];
  const last = periods[periods.length - 1];
  const Icon = CATEGORY_ICONS[med.category] ?? Pill;
  const reason = stopReasonLabel(last?.stop_reason ?? null);
  const restartLabel = med.schedule_type === "once" ? "Új alkalom" : med.schedule_type === "course" ? "Új kúra" : "Újraindítás";
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface py-3 pl-3 pr-2">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-muted">
        <Icon size={20} aria-hidden="true" />
      </span>
      <Link href={`/gyogyszerek/${med.id}`} className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{med.name}</span>
        <span className="block text-sm text-text-muted">
          {categoryLabel(med.category)}
          {first && last && (
            <>
              {" · "}
              {first.start_date === (last.end_date ?? last.start_date)
                ? formatShortDate(first.start_date)
                : `${formatShortDate(first.start_date)} – ${last.end_date ? formatShortDate(last.end_date) : "…"}`}
            </>
          )}
          {periods.length > 1 && ` · ${periods.length} ${med.schedule_type === "once" ? "alkalom" : "időszak"}`}
        </span>
        {reason && (
          <span className="mt-1 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-text-muted">{reason}</span>
        )}
      </Link>
      <Link
        href={`/gyogyszerek/${med.id}?uj=1`}
        className="flex h-9 shrink-0 items-center rounded-lg bg-primary-soft px-3 text-sm font-semibold text-link hover:opacity-80"
      >
        {restartLabel}
      </Link>
    </li>
  );
}

export default async function MedicationsPage({ searchParams }: { searchParams: Promise<{ lap?: string }> }) {
  const pet = await requireCurrentPet();
  const { lap } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("medications").select("*, medication_periods(*)").eq("pet_id", pet.id).order("name");
  const meds = data ?? [];
  const today = todayIso();
  const active = meds.filter((m) => isCurrent(m, m.medication_periods, today));
  const past = meds.filter((m) => !isCurrent(m, m.medication_periods, today));
  const showPast = lap === "korabbi";

  return (
    <>
      <PageHeader
        title="Gyógyszerek"
        icon={Pill}
        subtitle={pet.name}
        back={{ href: "/egeszseg", label: "Egészség" }}
        action={
          <div className="flex gap-2">
            <ButtonLink href="/export/gyogyszerek" variant="secondary" prefetch={false} target="_blank" aria-label="Gyógyszerlista PDF">
              <FileDown size={18} aria-hidden="true" /> PDF
            </ButtonLink>
            <ButtonLink href="/gyogyszerek/uj">+ Új</ButtonLink>
          </div>
        }
      />

      <Tabs
        items={[
          { href: "/gyogyszerek", label: "Szedi", count: active.length, active: !showPast },
          { href: "/gyogyszerek?lap=korabbi", label: "Korábbi", count: past.length, active: showPast },
        ]}
      />

      {showPast ? (
        past.length ? (
          <ul className="flex flex-col gap-2">
            {past.map((m) => (
              <PastMedicationCard key={m.id} med={m} />
            ))}
          </ul>
        ) : (
          <EmptyState>Nincs korábban szedett, már abbahagyott gyógyszer.</EmptyState>
        )
      ) : active.length === 0 ? (
        <EmptyState>
          <Pill className="mx-auto mb-2 text-text-muted" aria-hidden="true" />
          Jelenleg nincs szedett gyógyszer, féreghajtó vagy kiegészítő.
        </EmptyState>
      ) : (
        MED_CATEGORIES.map((cat) => {
          const list = active.filter((m) => m.category === cat.value);
          if (list.length === 0) return null;
          const Icon = CATEGORY_ICONS[cat.value];
          return (
            <GroupCard key={cat.value} title={cat.label} icon={Icon} count={list.length}>
              <ul className="flex flex-col gap-2">
                {list.map((m) => (
                  <MedicationRow key={m.id} med={m} today={today} />
                ))}
              </ul>
            </GroupCard>
          );
        })
      )}
    </>
  );
}
