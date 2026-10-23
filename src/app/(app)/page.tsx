import Link from "next/link";
import { Syringe } from "lucide-react";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { WeightChart } from "@/components/weight-chart";
import { weightSeries } from "@/lib/charts";
import { formatShortDate, formatWeight, todayIso } from "@/lib/format";
import { getWeights } from "@/lib/health";
import { requireCurrentPet } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(fromIso: string, toIso: string) {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY_MS);
}

function addDays(iso: string, days: number) {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const today = todayIso();

  const [weights, { data: expiring }] = await Promise.all([
    getWeights(pet.id),
    supabase
      .from("vaccinations")
      .select("id, vaccine, valid_until")
      .eq("pet_id", pet.id)
      .gte("valid_until", today)
      .lte("valid_until", addDays(today, 30))
      .order("valid_until"),
  ]);

  const latest = weights[0];
  const monthAgo = weights.find((w) => w.measured_on <= addDays(today, -30));
  const change = latest && monthAgo ? Number(latest.weight_kg) - Number(monthAgo.weight_kg) : null;

  const dateLabel = new Intl.DateTimeFormat("hu-HU", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Budapest",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium capitalize text-text-muted">{dateLabel}</p>
        <h1 className="text-2xl font-bold tracking-tight">Mai áttekintés</h1>
      </div>

      <section>
        <SectionTitle>Teendők</SectionTitle>
        <EmptyState>A napi gyógyszerek és az etetés a 2. fázisban jelennek meg itt.</EmptyState>
      </section>

      <section>
        <SectionTitle>Előttünk</SectionTitle>
        {expiring?.length ? (
          <ul className="flex flex-col gap-2">
            {expiring.map((v) => {
              const days = daysBetween(today, v.valid_until!);
              return (
                <li key={v.id}>
                  <Link
                    href="/egeszseg/oltasok"
                    className="flex items-center gap-3 rounded-2xl bg-warn-soft px-4 py-3"
                  >
                    <Syringe size={22} className="text-warn-text" aria-hidden="true" />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{v.vaccine} oltás lejár</span>
                      <span className="block text-xs text-warn-text">
                        {days === 0 ? "ma" : `${days} nap múlva`} · {formatShortDate(v.valid_until!)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState>A következő 30 napban nincs lejáró oltás.</EmptyState>
        )}
      </section>

      <section>
        <SectionTitle action={<span className="text-xs text-text-muted">utolsó mérések</span>}>
          Trendek
        </SectionTitle>
        <Card>
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase text-text-muted">Súly</p>
            <Link href="/egeszseg/suly" className="text-sm font-medium text-primary">
              + Mérés
            </Link>
          </div>
          {latest ? (
            <>
              <p className="text-2xl font-bold">{formatWeight(Number(latest.weight_kg))}</p>
              {change !== null && (
                <p className="text-xs font-semibold text-text-muted">
                  {change > 0 ? "+" : change < 0 ? "−" : "±"}
                  {formatWeight(Math.abs(change))} az elmúlt 30 napban
                </p>
              )}
              <div className="mt-3">
                <WeightChart data={weightSeries(weights)} height={160} />
              </div>
            </>
          ) : (
            <p className="py-4 text-sm text-text-muted">Még nincs rögzített súly.</p>
          )}
        </Card>
        <p className="mt-2 text-xs text-text-muted">
          Az étvágy, a mozgás és a fájdalom trendje a napló elkészülte után (5. fázis) jelenik meg.
        </p>
      </section>
    </div>
  );
}
