import { AddPanel, DeleteButton } from "@/components/forms";
import { History, Scale } from "lucide-react";
import { Card, EmptyState, Field, LoadMore, PageHeader, pageLimit, SectionTitle } from "@/components/ui";
import { WeightChart } from "@/components/weight-chart";
import { weightSeries } from "@/lib/charts";
import { formatDate, formatWeight, todayIso } from "@/lib/format";
import { getWeights } from "@/lib/health";
import { requireCurrentPet } from "@/lib/pets";
import { addWeight, deleteRecord } from "../actions";

export const metadata = { title: "Súly" };

export default async function WeightPage({ searchParams }: { searchParams: Promise<{ db?: string }> }) {
  const pet = await requireCurrentPet();
  const limit = pageLimit((await searchParams).db);
  const weights = await getWeights(pet.id);

  return (
    <>
      <PageHeader title="Súly" subtitle={pet.name} back={{ href: "/egeszseg", label: "Egészség" }} icon={Scale} />

      <Card className="mb-4">
        <WeightChart data={weightSeries(weights, 60)} height={240} />
      </Card>

      <div className="mb-6">
        <AddPanel label="Új mérés" action={addWeight}>
          <input type="hidden" name="pet_id" value={pet.id} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dátum" name="measured_on" type="date" defaultValue={todayIso()} required />
            <Field label="Súly (kg)" name="weight_kg" inputMode="decimal" placeholder="pl. 24,3" required />
          </div>
          <Field label="Megjegyzés" name="note" />
        </AddPanel>
      </div>

      <SectionTitle icon={History}>Mérések</SectionTitle>
      {weights.length === 0 ? (
        <EmptyState>Még nincs rögzített mérés.</EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {weights.slice(0, limit).map((w) => (
            <li key={w.id} className="flex items-center gap-3 py-2 pl-4 pr-2">
              <div className="flex-1">
                <p className="font-semibold">{formatWeight(Number(w.weight_kg))}</p>
                <p className="text-sm text-text-muted">
                  {formatDate(w.measured_on)}
                  {w.note && ` · ${w.note}`}
                </p>
              </div>
              <DeleteButton action={deleteRecord.bind(null, "weights", w.id, "/egeszseg/suly")} />
            </li>
          ))}
        </ul>
      )}
      <LoadMore shown={Math.min(limit, weights.length)} total={weights.length} href={(n) => `/egeszseg/suly?db=${n}`} />
    </>
  );
}
