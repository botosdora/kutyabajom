import Link from "next/link";
import { ShoppingBag, Syringe } from "lucide-react";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { TodayList, type TodayItem } from "@/components/today-list";
import { WeightChart } from "@/components/weight-chart";
import { weightSeries } from "@/lib/charts";
import {
  addDays,
  daysBetween,
  formatShortDate,
  formatTime,
  formatWeight,
  inDaysLabel,
  shortTime,
  todayIso,
} from "@/lib/format";
import { getWeights } from "@/lib/health";
import { requireCurrentPet } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";

type Reminder = { key: string; href: string; icon: "reorder" | "vaccine"; title: string; days: number; date: string };

export default async function DashboardPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const today = todayIso();

  const [weights, { data: doses }, { data: meals }, { data: reorders }, { data: expiring }] = await Promise.all([
    getWeights(pet.id),
    supabase.rpc("scheduled_doses", { p_pet_id: pet.id, p_from: today, p_to: today }),
    supabase.from("meal_logs").select("*").eq("pet_id", pet.id).eq("day", today),
    supabase
      .from("medications")
      .select("id, name, reorder_on")
      .eq("pet_id", pet.id)
      .eq("active", true)
      .lte("reorder_on", addDays(today, 7))
      .order("reorder_on"),
    supabase
      .from("vaccinations")
      .select("id, vaccine, valid_until")
      .eq("pet_id", pet.id)
      .gte("valid_until", today)
      .lte("valid_until", addDays(today, 30))
      .order("valid_until"),
  ]);

  // Napi teendők: az esedékes gyógyszerek és a két étkezés, időrendben.
  const doseItems: TodayItem[] = (doses ?? []).map((d) => ({
    kind: "dose",
    key: `${d.medication_id}-${d.scheduled_for}`,
    time: formatTime(d.scheduled_for),
    title: d.name,
    detail: d.dosage,
    medicationId: d.medication_id,
    scheduledFor: d.scheduled_for,
    logId: d.log_id,
    status: d.status as "given" | "missed" | "refused" | null,
    doneAt: d.given_at ? formatTime(d.given_at) : null,
  }));
  const mealItems: TodayItem[] = (["reggeli", "vacsora"] as const).map((meal) => {
    const log = meals?.find((m) => m.meal === meal);
    return {
      kind: "meal",
      key: meal,
      time: shortTime(meal === "reggeli" ? pet.breakfast_time : pet.dinner_time),
      title: meal === "reggeli" ? "Reggeli" : "Vacsora",
      detail: null,
      meal,
      logId: log?.id ?? null,
      status: (log?.status as "eaten" | "partial" | "refused" | undefined) ?? null,
      doneAt: log ? formatTime(log.logged_at) : null,
    };
  });
  const items = [...doseItems, ...mealItems].sort((a, b) => a.time.localeCompare(b.time));
  const doneCount = items.filter((i) => i.status !== null).length;

  const reminders: Reminder[] = [
    ...(reorders ?? []).map((m) => ({
      key: `r-${m.id}`,
      href: `/gyogyszerek/${m.id}`,
      icon: "reorder" as const,
      title: `${m.name} újravásárlás`,
      days: daysBetween(today, m.reorder_on!),
      date: m.reorder_on!,
    })),
    ...(expiring ?? []).map((v) => ({
      key: `v-${v.id}`,
      href: "/egeszseg/oltasok",
      icon: "vaccine" as const,
      title: `${v.vaccine} oltás lejár`,
      days: daysBetween(today, v.valid_until!),
      date: v.valid_until!,
    })),
  ].sort((a, b) => a.days - b.days);

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
    <div className="wide flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-text-muted first-letter:uppercase">{dateLabel}</p>
        <h1 className="text-2xl font-bold tracking-tight">Mai áttekintés</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <section>
          <SectionTitle
            action={
              <span className="text-sm text-text-muted">
                {doneCount} / {items.length}
              </span>
            }
          >
            Teendők
          </SectionTitle>
          <TodayList items={items} petId={pet.id} day={today} />
          <Link href="/gyogyszerek" className="mt-2 inline-block text-sm font-medium text-link">
            Gyógyszerek kezelése →
          </Link>
        </section>

        <div className="flex flex-col gap-6">
          <section>
            <SectionTitle>Előttünk</SectionTitle>
            {reminders.length ? (
              <ul className="flex flex-col gap-2">
                {reminders.map((r) => {
                  const Icon = r.icon === "reorder" ? ShoppingBag : Syringe;
                  const overdue = r.days < 0;
                  return (
                    <li key={r.key}>
                      <Link
                        href={r.href}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                          r.icon === "reorder" ? "bg-warn-soft" : "bg-primary-soft"
                        }`}
                      >
                        <Icon
                          size={22}
                          className={r.icon === "reorder" ? "text-warn-text" : "text-link"}
                          aria-hidden="true"
                        />
                        <span className="flex-1">
                          <span className="block text-sm font-semibold">{r.title}</span>
                          <span
                            className={`block text-xs ${overdue ? "font-semibold text-danger" : "text-text-muted"}`}
                          >
                            {inDaysLabel(r.days)} · {formatShortDate(r.date)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState>Nincs közelgő újravásárlás vagy lejáró oltás.</EmptyState>
            )}
          </section>

          <section>
            <SectionTitle action={<span className="text-xs text-text-muted">utolsó mérések</span>}>
              Trendek
            </SectionTitle>
            <Card>
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase text-text-muted">Súly</p>
                <Link href="/egeszseg/suly" className="text-sm font-medium text-link">
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
      </div>
    </div>
  );
}
