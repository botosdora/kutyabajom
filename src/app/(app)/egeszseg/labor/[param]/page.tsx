import { notFound } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { DeleteButton } from "@/components/forms";
import { LabChart } from "@/components/lab-chart";
import { Card, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatShortDate } from "@/lib/format";
import { formatLabValue, formatRange, LAB_STATUS_STYLE, labStatus } from "@/lib/labs";
import { requireCurrentPet } from "@/lib/pets";
import { deleteLabResult } from "../actions";

export default async function LabParameterPage({ params }: { params: Promise<{ param: string }> }) {
  const name = decodeURIComponent((await params).param);
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const { data } = await supabase
    .from("lab_results")
    .select("*, medical_events(title)")
    .eq("pet_id", pet.id)
    .eq("parameter", name)
    .order("measured_on", { ascending: true });
  if (!data?.length) notFound();
  const latest = data[data.length - 1];

  return (
    <>
      <PageHeader title={name} subtitle={pet.name} back={{ href: "/egeszseg/labor", label: "Laborértékek" }} icon={FlaskConical} />
      <Card className="mb-4">
        <p className="text-sm text-text-muted">
          Referencia: {formatRange(latest.ref_low, latest.ref_high, latest.unit) ?? "nincs megadva"}
        </p>
        <div className="mt-3">
          <LabChart
            name={name}
            unit={latest.unit}
            low={latest.ref_low}
            high={latest.ref_high}
            data={data.map((r) => ({ label: formatShortDate(r.measured_on), value: Number(r.value) }))}
          />
        </div>
      </Card>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {[...data].reverse().map((r) => {
          const status = labStatus(Number(r.value), r.ref_low, r.ref_high);
          return (
            <li key={r.id} className="flex items-center gap-3 py-2.5 pl-4 pr-2">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold tabular-nums">{formatLabValue(Number(r.value), r.unit)}</span>
                <span className="block truncate text-xs text-text-muted">
                  {formatDate(r.measured_on)}
                  {r.medical_events?.title && ` · ${r.medical_events.title}`}
                </span>
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LAB_STATUS_STYLE[status].badge}`}>
                {LAB_STATUS_STYLE[status].label}
              </span>
              <DeleteButton action={deleteLabResult.bind(null, r.id)} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
