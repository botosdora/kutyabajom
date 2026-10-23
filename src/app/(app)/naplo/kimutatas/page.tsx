import Link from "next/link";
import { BarChart3, FileDown, ListChecks, Sparkles, Toilet } from "lucide-react";
import { LogEntryCard } from "@/components/log-entry-card";
import { getDoseSummaries } from "@/lib/day-items";
import { TrendChart } from "@/components/trend-chart";
import { ButtonLink, Card, EmptyState, LoadMore, PageHeader, pageLimit, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { SCALE_ICONS } from "@/components/scale-icons";
import { addDays, formatDate, todayIso } from "@/lib/format";
import { average, OBSERVATIONS, rateScale, SCALES, STOOL_OPTIONS, TONE_STYLE } from "@/lib/journal";
import { requireCurrentPet } from "@/lib/pets";
import { TREND_SERIES, trendData } from "@/lib/trends";

export const metadata = { title: "Napló kimutatás" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PRESETS = [
  { days: 7, label: "7 nap" },
  { days: 30, label: "30 nap" },
  { days: 90, label: "3 hónap" },
];

export default async function JournalReportPage({ searchParams }: { searchParams: Promise<{ tol?: string; ig?: string; db?: string }> }) {
  const pet = await requireCurrentPet();
  const { tol, ig, db } = await searchParams;
  const limit = pageLimit(db);
  const today = todayIso();
  const to = ig && DATE_RE.test(ig) ? ig : today;
  const from = tol && DATE_RE.test(tol) ? tol : addDays(to, -29);
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("pet_id", pet.id)
    .gte("day", from)
    .lte("day", to)
    .order("day", { ascending: false });
  const logs = data ?? [];
  const summaries = await getDoseSummaries(pet.id, from, to);

  const counts = (values: string[]) =>
    values.reduce<Record<string, number>>((acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }), {});
  const stoolCounts = counts(logs.map((l) => l.stool).filter((s): s is string => !!s));
  const obsCounts = counts(logs.flatMap((l) => l.observations));

  return (
    <>
      <PageHeader title="Napló kimutatás" subtitle={pet.name} back={{ href: "/naplo", label: "Napló" }} icon={BarChart3} />

      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const presetFrom = addDays(today, -(p.days - 1));
          const active = to === today && from === presetFrom;
          return (
            <Link
              key={p.days}
              href={`/naplo/kimutatas?tol=${presetFrom}&ig=${today}`}
              className={`flex h-9 items-center rounded-full px-3 text-sm font-medium ${
                active ? "bg-primary text-on-primary" : "border border-border-strong hover:bg-surface-muted"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Ettől
          <input type="date" name="tol" defaultValue={from} className="h-10 rounded-lg border border-border-strong bg-surface px-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Eddig
          <input type="date" name="ig" defaultValue={to} className="h-10 rounded-lg border border-border-strong bg-surface px-2" />
        </label>
        <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary">
          Mutasd
        </button>
      </form>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {formatDate(from)} – {formatDate(to)} · {logs.length} bejegyzés
        </p>
        <ButtonLink href={`/export/naplo?tol=${from}&ig=${to}`} variant="secondary" prefetch={false} target="_blank">
          <FileDown size={18} aria-hidden="true" /> PDF
        </ButtonLink>
      </div>

      {logs.length === 0 ? (
        <EmptyState>Ebben az időszakban nincs naplóbejegyzés.</EmptyState>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SCALES.map((s) => {
              const avg = average(logs.map((l) => l[s.key]));
              const rating = avg === null ? null : rateScale(s.kind, Math.round(avg));
              const Icon = SCALE_ICONS[s.key];
              return (
                <Card key={s.key} className="p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-text-muted">
                    <Icon size={14} aria-hidden="true" />
                    {s.short}
                  </p>
                  <p className="text-2xl font-bold">{avg?.toLocaleString("hu-HU") ?? "–"}</p>
                  {rating && (
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${TONE_STYLE[rating.tone].badge}`}>
                      átlag: {rating.word}
                    </span>
                  )}
                </Card>
              );
            })}
          </div>

          <Card className="mb-4">
            <TrendChart data={trendData(logs)} series={TREND_SERIES} />
          </Card>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <Card>
              <SectionTitle icon={Toilet}>Széklet</SectionTitle>
              <ul className="text-sm">
                {STOOL_OPTIONS.filter((o) => stoolCounts[o.value]).map((o) => (
                  <li key={o.value} className="flex justify-between py-0.5">
                    <span>{o.label}</span>
                    <span className="font-semibold">{stoolCounts[o.value]} nap</span>
                  </li>
                ))}
                {Object.keys(stoolCounts).length === 0 && <li className="text-text-muted">Nincs adat</li>}
              </ul>
            </Card>
            <Card>
              <SectionTitle icon={Sparkles}>Megfigyelések</SectionTitle>
              <ul className="text-sm">
                {OBSERVATIONS.filter((o) => obsCounts[o.value]).map((o) => (
                  <li key={o.value} className="flex justify-between py-0.5">
                    <span>{o.label}</span>
                    <span className="font-semibold">{obsCounts[o.value]} nap</span>
                  </li>
                ))}
                {Object.keys(obsCounts).length === 0 && <li className="text-text-muted">Nincs adat</li>}
              </ul>
            </Card>
          </div>

          <SectionTitle icon={ListChecks}>Bejegyzések</SectionTitle>
          <ul className="flex flex-col gap-3">
            {logs.slice(0, limit).map((l) => (
              <LogEntryCard key={l.id} log={l} doses={summaries.get(l.day)} />
            ))}
          </ul>
          <LoadMore shown={Math.min(limit, logs.length)} total={logs.length} href={(n) => `/naplo/kimutatas?tol=${from}&ig=${to}&db=${n}`} />
        </>
      )}
    </>
  );
}
