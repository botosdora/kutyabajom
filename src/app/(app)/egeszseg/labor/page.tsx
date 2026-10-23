import Link from "next/link";
import { ChevronRight, FlaskConical } from "lucide-react";
import { LabForm } from "@/components/lab-form";
import { EmptyState, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatShortDate, todayIso } from "@/lib/format";
import { formatLabValue, formatRange, LAB_STATUS_STYLE, labStatus } from "@/lib/labs";
import { requireCurrentPet } from "@/lib/pets";
import { addLabResults } from "./actions";

export const metadata = { title: "Laborértékek" };

export default async function LabPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const [{ data }, { data: events }] = await Promise.all([
    supabase.from("lab_results").select("*").eq("pet_id", pet.id).order("measured_on", { ascending: false }),
    supabase.from("medical_events").select("id, title, event_date").eq("pet_id", pet.id).order("event_date", { ascending: false }).limit(30),
  ]);
  const results = data ?? [];

  // Paraméterenként a legutóbbi érték és a mérések száma.
  const byParam = new Map<string, typeof results>();
  for (const r of results) byParam.set(r.parameter, [...(byParam.get(r.parameter) ?? []), r]);
  const params = [...byParam.entries()].sort((a, b) => a[0].localeCompare(b[0], "hu"));

  return (
    <>
      <PageHeader title="Laborértékek" subtitle={pet.name} back={{ href: "/egeszseg", label: "Egészség" }} icon={FlaskConical} />

      <div className="mb-6">
        <LabForm
          action={addLabResults}
          petId={pet.id}
          today={todayIso()}
          events={(events ?? []).map((e) => ({ value: e.id, label: `${e.title} (${formatDate(e.event_date)})` }))}
          known={params.map(([name, list]) => ({ name, unit: list[0].unit, low: list[0].ref_low, high: list[0].ref_high }))}
        />
      </div>

      {params.length === 0 ? (
        <EmptyState>Még nincs rögzített laborérték. A vérkép fontosabb értékeit itt követheted vizsgálatról vizsgálatra.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {params.map(([name, list]) => {
            const latest = list[0];
            const status = labStatus(Number(latest.value), latest.ref_low, latest.ref_high);
            const prev = list[1];
            const trend = prev ? Number(latest.value) - Number(prev.value) : null;
            return (
              <li key={name}>
                <Link
                  href={`/egeszseg/labor/${encodeURIComponent(name)}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{name}</span>
                    <span className="block truncate text-xs text-text-muted">
                      {formatShortDate(latest.measured_on)} · {list.length} mérés
                      {formatRange(latest.ref_low, latest.ref_high, latest.unit) && ` · ref.: ${formatRange(latest.ref_low, latest.ref_high, latest.unit)}`}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-bold tabular-nums">{formatLabValue(Number(latest.value), latest.unit)}</span>
                    <span className="flex items-center justify-end gap-1.5">
                      {trend !== null && trend !== 0 && (
                        <span className="text-xs text-text-muted">{trend > 0 ? "▲" : "▼"}</span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LAB_STATUS_STYLE[status].badge}`}>
                        {LAB_STATUS_STYLE[status].label}
                      </span>
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
