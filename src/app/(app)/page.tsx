import Link from "next/link";
import { BellRing, Cake, Clock, MoonStar, PartyPopper, Sun, Sunrise, Sunset, CalendarDays, ClipboardList, ListTodo, MessageCircleQuestion, NotebookPen, ShoppingBag, Stethoscope, Syringe, TrendingUp, Utensils } from "lucide-react";
import { TrendChart } from "@/components/trend-chart";
import { TREND_SERIES, trendData } from "@/lib/trends";
import { EventRow, type EventRowData } from "@/components/event-row";
import { REMIND_DAYS, vetTypeLabel } from "@/lib/calendar";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";
import { ProgressRing } from "@/components/progress-ring";
import { QuickAdd } from "@/components/quick-add";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { addQuickTask } from "./naptar/actions";
import { TodayList } from "@/components/today-list";
import { WeightChart } from "@/components/weight-chart";
import { weightSeries } from "@/lib/charts";
import {
  addDays,
  daysBetween,
  formatHuf,
  formatShortDate,
  formatWeight,
  inDaysLabel,
  todayIso,
} from "@/lib/format";
import { getDayItems } from "@/lib/day-items";
import { getWeights } from "@/lib/health";
import { requireCurrentPet } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";

type Reminder = {
  key: string;
  href: string;
  icon: "reorder" | "food" | "vaccine" | "vet" | "task";
  title: string;
  days: number;
  date: string;
};

const REMINDER_STYLE = {
  reorder: { Icon: ShoppingBag, box: "bg-warn-soft", icon: "text-warn-text" },
  food: { Icon: Utensils, box: "bg-warn-soft", icon: "text-warn-text" },
  vaccine: { Icon: Syringe, box: "bg-primary-soft", icon: "text-link" },
  vet: { Icon: Stethoscope, box: "bg-primary-soft", icon: "text-link" },
  task: { Icon: ClipboardList, box: "bg-surface-muted", icon: "text-text-muted" },
};

const EVENT_SELECT = "id, category, vet_type, title, event_date, event_time, status, task_types(name)";

export default async function DashboardPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const today = todayIso();

  const monthStart = `${today.slice(0, 7)}-01`;
  const [
    weights,
    { data: reorders },
    { data: expiring },
    dayItems,
    { data: pendingEvents },
    { data: upcomingEvents },
    { data: vetCosts },
    { data: foodReorders },
    { data: recentLogs },
  ] = await Promise.all([
    getWeights(pet.id),
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
    getDayItems(pet, today),
    supabase
      .from("calendar_events")
      .select(EVENT_SELECT)
      .eq("pet_id", pet.id)
      .eq("status", "planned")
      .lt("event_date", today)
      .order("event_date"),
    supabase
      .from("calendar_events")
      .select("id, category, vet_type, title, event_date")
      .eq("pet_id", pet.id)
      .eq("status", "planned")
      .gt("event_date", today)
      .lte("event_date", addDays(today, REMIND_DAYS.orvosi)),
    supabase
      .from("all_expenses")
      .select("amount_huf, category")
      .eq("pet_id", pet.id)
      .gte("spent_on", monthStart)
      .lte("spent_on", today),
    supabase
      .from("foods")
      .select("id, name, reorder_on")
      .eq("pet_id", pet.id)
      .eq("status", "active")
      .lte("reorder_on", addDays(today, REMIND_DAYS.reorder)),
    supabase
      .from("daily_logs")
      .select("day, mood, appetite, activity, pain")
      .eq("pet_id", pet.id)
      .gte("day", addDays(today, -13))
      .order("day"),
  ]);
  const loggedToday = (recentLogs ?? []).some((l) => l.day === today);

  const { items, vetEvents: vetToday } = dayItems;
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
    ...(foodReorders ?? []).map((f) => ({
      key: `f-${f.id}`,
      href: `/etkezes/${f.id}`,
      icon: "food" as const,
      title: `${f.name} újrarendelés`,
      days: daysBetween(today, f.reorder_on!),
      date: f.reorder_on!,
    })),
    ...(expiring ?? []).map((v) => ({
      key: `v-${v.id}`,
      href: "/egeszseg/oltasok",
      icon: "vaccine" as const,
      title: `${v.vaccine} oltás lejár`,
      days: daysBetween(today, v.valid_until!),
      date: v.valid_until!,
    })),
    ...(upcomingEvents ?? [])
      .filter((e) => daysBetween(today, e.event_date) <= REMIND_DAYS[e.category as "orvosi" | "feladat"])
      .map((e) => ({
        key: `e-${e.id}`,
        href: `/naptar/${e.id}`,
        icon: e.category === "orvosi" ? ("vet" as const) : ("task" as const),
        title:
          e.category === "orvosi" && !e.title.toLowerCase().includes(vetTypeLabel(e.vet_type).toLowerCase())
            ? `${e.title} (${vetTypeLabel(e.vet_type).toLowerCase()})`
            : e.title,
        days: daysBetween(today, e.event_date),
        date: e.event_date,
      })),
  ].sort((a, b) => a.days - b.days);
  const monthCost = (vetCosts ?? []).reduce((sum, c) => sum + (c.amount_huf ?? 0), 0);
  const costByCategory = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    sum: (vetCosts ?? []).filter((e) => e.category === c.value).reduce((s, e) => s + (e.amount_huf ?? 0), 0),
  })).filter((c) => c.sum > 0);
  const monthName = new Intl.DateTimeFormat("hu-HU", { month: "long", timeZone: "Europe/Budapest" }).format(new Date());

  const latest = weights[0];
  const monthAgo = weights.find((w) => w.measured_on <= addDays(today, -30));
  const change = latest && monthAgo ? Number(latest.weight_kg) - Number(monthAgo.weight_kg) : null;

  // Szülinap vagy a hozzánk kerülés évfordulója ma?
  const years = (from: string | null) =>
    from && from.slice(5) === today.slice(5) && from < today ? Number(today.slice(0, 4)) - Number(from.slice(0, 4)) : null;
  const birthdayYears = years(pet.birth_date);
  const adoptionYears = years(pet.adoption_date);

  // Napszakhoz illő köszöntés és a következő, még el nem végzett teendő (budapesti idő szerint).
  const nowHm = new Intl.DateTimeFormat("hu-HU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Budapest" }).format(new Date());
  const hour = Number(nowHm.slice(0, 2));
  const greeting = hour >= 5 && hour < 10 ? "Jó reggelt" : hour < 18 && hour >= 10 ? "Szép napot" : hour >= 18 && hour < 22 ? "Jó estét" : "Jó éjszakát";
  const [DayIcon, dayIconColor] =
    hour >= 5 && hour < 10
      ? [Sunrise, "var(--series-4)"]
      : hour >= 10 && hour < 18
        ? [Sun, "var(--series-4)"]
        : hour >= 18 && hour < 22
          ? [Sunset, "var(--series-2)"]
          : [MoonStar, "var(--link)"];
  const next = items.find((i) => i.status === null && i.time !== "–" && i.time >= nowHm);

  const dateLabel = new Intl.DateTimeFormat("hu-HU", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Budapest",
  }).format(new Date());

  return (
    <div className="wide flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-3xl bg-primary-soft p-4 sm:p-5">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-surface" aria-hidden="true">
          <DayIcon size={34} style={{ color: dayIconColor }} />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {pet.name}!
          </h1>
          <p className="text-sm font-medium text-text-muted first-letter:uppercase">{dateLabel}</p>
          {next && (
            <p className="mt-1 flex items-center gap-1.5 text-sm">
              <Clock size={15} className="shrink-0 text-link" aria-hidden="true" />
              <span className="truncate">
                Következő: <b>{next.time}</b> · {next.title}
              </span>
            </p>
          )}
        </div>
      </div>

      {(birthdayYears !== null || adoptionYears !== null) && (
        <div className="flex items-center gap-4 rounded-3xl bg-primary px-5 py-4 text-on-primary">
          <Cake size={36} aria-hidden="true" className="shrink-0" />
          <div>
            <p className="text-lg font-bold">
              {birthdayYears !== null ? `Boldog szülinapot, ${pet.name}!` : `Ma van ${pet.name} évfordulója!`}
            </p>
            <p className="text-sm opacity-90">
              {birthdayYears !== null && `Ma ${birthdayYears} éves.`}
              {birthdayYears !== null && adoptionYears !== null && " "}
              {adoptionYears !== null && `${adoptionYears} éve van veletek.`}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <section>
          <SectionTitle icon={ListTodo} action={<ProgressRing done={doneCount} total={items.length} />}>
            Teendők
          </SectionTitle>
          {items.length > 0 && doneCount === items.length && (
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-success-soft px-4 py-3 text-success">
              <PartyPopper size={22} aria-hidden="true" />
              <span className="text-sm font-semibold">Minden kész mára! Ügyesek vagytok.</span>
            </div>
          )}
          <TodayList items={items} petId={pet.id} day={today} isToday />
          <div className="mt-1">
            <QuickAdd action={addQuickTask} petId={pet.id} />
          </div>
          <Link href="/gyogyszerek" className="mt-2 inline-block text-sm font-medium text-link">
            Gyógyszerek kezelése →
          </Link>

          <Link
            href="/naplo"
            className={`mt-6 flex items-center gap-3 rounded-2xl px-4 py-3 ${loggedToday ? "border border-border bg-surface" : "bg-primary-soft"}`}
          >
            <NotebookPen size={22} className="text-link" aria-hidden="true" />
            <span className="flex-1">
              <span className="block text-sm font-semibold">{loggedToday ? "A mai napló kitöltve" : "Töltsd ki a mai naplót"}</span>
              <span className="block text-xs text-text-muted">Kedv, étvágy, mozgás, fájdalom, széklet…</span>
            </span>
            <span className="text-sm font-semibold text-link">{loggedToday ? "Módosítás" : "Kitöltés"}</span>
          </Link>

          {!!pendingEvents?.length && (
            <div className="mt-6">
              <SectionTitle icon={MessageCircleQuestion}>Visszajelzésre vár</SectionTitle>
              <p className="mb-2 text-sm text-text-muted">Megtörtént? Koppints rá, és rögzítsd.</p>
              <ul className="flex flex-col gap-2">
                {(pendingEvents as EventRowData[]).map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <SectionTitle
              icon={CalendarDays}
              action={
                <Link href={`/naptar/uj?nap=${today}`} className="text-sm font-semibold text-link">
                  + Új
                </Link>
              }
            >
              Mai orvosi események
            </SectionTitle>
            {vetToday.length ? (
              <ul className="flex flex-col gap-2">
                {vetToday.map((e) => (
                  <EventRow key={e.id} event={e} showDate={false} />
                ))}
              </ul>
            ) : (
              <EmptyState>Mára nincs orvosi esemény.</EmptyState>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section>
            <SectionTitle icon={BellRing}>Előttünk</SectionTitle>
            {reminders.length ? (
              <ul className="flex flex-col gap-2">
                {reminders.map((r) => {
                  const { Icon, box, icon } = REMINDER_STYLE[r.icon];
                  const overdue = r.days < 0;
                  return (
                    <li key={r.key}>
                      <Link
                        href={r.href}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${box}`}
                      >
                        <Icon size={22} className={icon} aria-hidden="true" />
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
              <EmptyState>Nincs közelgő vizsgálat, feladat, újravásárlás vagy lejáró oltás.</EmptyState>
            )}
          </section>

          <Link href="/koltsegek" className="block rounded-2xl border border-border bg-surface p-4 hover:bg-surface-muted">
            <p className="text-xs font-semibold uppercase text-text-muted">Költségek, {monthName}</p>
            <p className="text-2xl font-bold">{formatHuf(monthCost)}</p>
            {monthCost > 0 && (
              <>
                <div className="mt-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                  {costByCategory.map((c) => (
                    <span key={c.value} style={{ width: `${(c.sum / monthCost) * 100}%`, background: c.color }} />
                  ))}
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {costByCategory.map((c) => (
                    <li key={c.value} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                      <span className="text-text-muted">{c.label}</span>
                      <span className="font-semibold">{formatHuf(c.sum)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-2 text-sm font-medium text-link">Összes költség →</p>
          </Link>

          <section>
            <SectionTitle icon={TrendingUp} action={<span className="text-xs text-text-muted">utolsó mérések</span>}>
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
            <Card className="mt-3">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase text-text-muted">Napló, utolsó 14 nap</p>
                <Link href="/naplo/kimutatas" className="text-sm font-medium text-link">
                  Kimutatás
                </Link>
              </div>
              <div className="mt-2">
                <TrendChart data={trendData(recentLogs ?? [])} series={TREND_SERIES} height={200} />
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
