import Link from "next/link";
import { DeleteButton } from "@/components/forms";
import { ExpenseForm } from "@/components/expense-form";
import { Receipt, Wallet } from "lucide-react";
import { CostDonut } from "@/components/cost-donut";
import { Card, EmptyState, LoadMore, PageHeader, pageLimit, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from "@/lib/expenses";
import { formatDate, formatHuf, todayIso } from "@/lib/format";
import { requireCurrentPet } from "@/lib/pets";
import { addExpense, deleteExpense } from "./actions";

export const metadata = { title: "Költségek" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function periodRange(period: string, today: string, from?: string, to?: string) {
  const [y, m] = today.split("-").map(Number);
  const monthStart = (yy: number, mm: number) => new Date(Date.UTC(yy, mm - 1, 1)).toISOString().slice(0, 10);
  const monthEnd = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).toISOString().slice(0, 10);
  switch (period) {
    case "elozo":
      return { from: monthStart(y, m - 1), to: monthEnd(y, m - 1) };
    case "ev":
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    case "egyedi":
      return {
        from: from && DATE_RE.test(from) ? from : monthStart(y, m),
        to: to && DATE_RE.test(to) ? to : today,
      };
    default:
      return { from: monthStart(y, m), to: monthEnd(y, m) };
  }
}

const PERIODS = [
  { value: "honap", label: "Ez a hónap" },
  { value: "elozo", label: "Előző hónap" },
  { value: "ev", label: "Idei év" },
  { value: "egyedi", label: "Egyedi" },
];

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ idoszak?: string; tol?: string; ig?: string; db?: string }>;
}) {
  const pet = await requireCurrentPet();
  const { idoszak = "honap", tol, ig, db } = await searchParams;
  const limit = pageLimit(db);
  const today = todayIso();
  const range = periodRange(idoszak, today, tol, ig);
  const supabase = await createClient();

  const [{ data: items }, { data: meds }, { data: events }, { data: foods }] = await Promise.all([
    supabase
      .from("all_expenses")
      .select("*")
      .eq("pet_id", pet.id)
      .gte("spent_on", range.from)
      .lte("spent_on", range.to)
      .order("spent_on", { ascending: false }),
    supabase.from("medications").select("id, name").eq("pet_id", pet.id).order("name"),
    supabase.from("medical_events").select("id, title, event_date").eq("pet_id", pet.id).order("event_date", { ascending: false }).limit(30),
    supabase.from("foods").select("id, name").eq("pet_id", pet.id).neq("status", "failed").order("name"),
  ]);

  const list = items ?? [];
  const total = list.reduce((sum, e) => sum + (e.amount_huf ?? 0), 0);
  const slices = EXPENSE_CATEGORIES.map((c) => ({
    key: c.value,
    label: c.label,
    color: c.color,
    value: list.filter((e) => e.category === c.value).reduce((s, e) => s + (e.amount_huf ?? 0), 0),
  }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  const colorOf = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.value, c.color]));
  const query = new URLSearchParams({ idoszak, ...(tol ? { tol } : {}), ...(ig ? { ig } : {}) });

  return (
    <>
      <PageHeader title="Költségek" subtitle={pet.name} icon={Wallet} />

      <div className="mb-3 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/koltsegek?idoszak=${p.value}`}
            className={`flex h-9 items-center rounded-full px-3 text-sm font-medium ${
              idoszak === p.value ? "bg-primary text-on-primary" : "border border-border-strong hover:bg-surface-muted"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>
      {idoszak === "egyedi" && (
        <form className="mb-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="idoszak" value="egyedi" />
          <label className="flex flex-col gap-1 text-sm font-medium">
            Ettől
            <input type="date" name="tol" defaultValue={range.from} className="h-10 rounded-lg border border-border-strong bg-surface px-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Eddig
            <input type="date" name="ig" defaultValue={range.to} className="h-10 rounded-lg border border-border-strong bg-surface px-2" />
          </label>
          <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary">
            Mutasd
          </button>
        </form>
      )}

      <Card className="mb-4">
        <p className="mb-3 text-sm text-text-muted">
          {formatDate(range.from)} – {formatDate(range.to)}
        </p>
        {total > 0 ? (
          <CostDonut slices={slices} total={total} />
        ) : (
          <p className="py-4 text-center text-sm text-text-muted">Ebben az időszakban nincs kiadás.</p>
        )}
      </Card>

      <div className="mb-6">
        <ExpenseForm
          action={addExpense}
          petId={pet.id}
          categories={EXPENSE_CATEGORIES}
          medications={(meds ?? []).map((m) => ({ value: m.id, label: m.name }))}
          foods={(foods ?? []).map((f) => ({ value: f.id, label: f.name }))}
          medicalEvents={(events ?? []).map((e) => ({ value: e.id, label: `${e.title} (${formatDate(e.event_date)})` }))}
          today={today}
        />
      </div>

      <SectionTitle icon={Receipt} action={<span className="text-sm text-text-muted">{list.length} db</span>}>
        Tételek
      </SectionTitle>
      {list.length === 0 ? (
        <EmptyState>Ebben az időszakban nincs rögzített kiadás.</EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {list.slice(0, limit).map((e) => (
            <li key={`${e.source}-${e.id}`} className="flex items-center gap-3 py-2.5 pl-4 pr-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorOf[e.category ?? ""] }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.title}</p>
                <p className="truncate text-xs text-text-muted">
                  {formatDate(e.spent_on)} · {expenseCategoryLabel(e.category ?? "")}
                  {e.notes && ` · ${e.notes}`}
                </p>
              </div>
              <span className="font-semibold">{formatHuf(e.amount_huf ?? 0)}</span>
              <DeleteButton action={deleteExpense.bind(null, e.id!, e.source!)} confirmText="Biztosan törlöd ezt a tételt?" />
            </li>
          ))}
        </ul>
      )}
      <LoadMore shown={Math.min(limit, list.length)} total={list.length} href={(n) => `/koltsegek?${query}&db=${n}`} />
    </>
  );
}
