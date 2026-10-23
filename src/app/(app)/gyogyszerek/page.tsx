import Link from "next/link";
import { ChevronRight, Pill } from "lucide-react";
import { ButtonLink, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, inDaysLabel, todayIso } from "@/lib/format";
import { categoryLabel, describeSchedule, MED_CATEGORIES } from "@/lib/medications";
import { requireCurrentPet } from "@/lib/pets";
import type { Tables } from "@/lib/database.types";

export const metadata = { title: "Gyógyszerek" };

function MedicationRow({ med, today }: { med: Tables<"medications">; today: string }) {
  const reorderDays = med.reorder_on ? daysBetween(today, med.reorder_on) : null;
  return (
    <li>
      <Link
        href={`/gyogyszerek/${med.id}`}
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-muted"
      >
        <span className="flex-1">
          <span className="block font-semibold">
            {med.name}
            {med.dosage && <span className="font-normal text-text-muted"> · {med.dosage}</span>}
          </span>
          <span className="block text-sm text-text-muted">{describeSchedule(med)}</span>
          {reorderDays !== null && reorderDays <= 7 && (
            <span className="mt-0.5 block text-sm font-medium text-warn-text">
              Újravásárlás: {inDaysLabel(reorderDays)}
            </span>
          )}
        </span>
        <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

export default async function MedicationsPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const { data: meds } = await supabase.from("medications").select("*").eq("pet_id", pet.id).order("name");
  const today = todayIso();
  const active = (meds ?? []).filter((m) => m.active);
  const inactive = (meds ?? []).filter((m) => !m.active);

  return (
    <>
      <PageHeader
        title="Gyógyszerek"
        subtitle={pet.name}
        back={{ href: "/egeszseg", label: "Egészség" }}
        action={<ButtonLink href="/gyogyszerek/uj">+ Új</ButtonLink>}
      />

      {active.length === 0 && inactive.length === 0 && (
        <EmptyState>
          <Pill className="mx-auto mb-2 text-text-muted" aria-hidden="true" />
          Még nincs rögzített gyógyszer, féreghajtó vagy kiegészítő.
        </EmptyState>
      )}

      {MED_CATEGORIES.map((cat) => {
        const list = active.filter((m) => m.category === cat.value);
        if (list.length === 0) return null;
        return (
          <section key={cat.value} className="mb-6">
            <SectionTitle>{cat.label}</SectionTitle>
            <ul className="flex flex-col gap-2">
              {list.map((m) => (
                <MedicationRow key={m.id} med={m} today={today} />
              ))}
            </ul>
          </section>
        );
      })}

      {inactive.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-semibold text-text-muted">
            Korábbi, már nem szedett ({inactive.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-2 opacity-75">
            {inactive.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/gyogyszerek/${m.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3"
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-sm text-text-muted">{categoryLabel(m.category)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
