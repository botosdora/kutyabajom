import Link from "next/link";
import { BarChart3, ChevronLeft, ChevronRight, History, NotebookPen } from "lucide-react";
import { LogEntryCard } from "@/components/log-entry-card";
import { LogForm } from "@/components/log-form";
import { ButtonLink, Card, EmptyState, LoadMore, PageHeader, pageLimit, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatDate, todayIso } from "@/lib/format";
import { requireCurrentPet } from "@/lib/pets";
import { saveLog } from "./actions";

export const metadata = { title: "Napló" };

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ nap?: string; db?: string }> }) {
  const pet = await requireCurrentPet();
  const { nap, db } = await searchParams;
  const limit = pageLimit(db);
  const today = todayIso();
  const day = nap && /^\d{4}-\d{2}-\d{2}$/.test(nap) && nap <= today ? nap : today;
  const supabase = await createClient();

  const [{ data: log }, { data: recent, count }] = await Promise.all([
    supabase.from("daily_logs").select("*").eq("pet_id", pet.id).eq("day", day).maybeSingle(),
    supabase
      .from("daily_logs")
      .select("*", { count: "exact" })
      .eq("pet_id", pet.id)
      .neq("day", day)
      .order("day", { ascending: false })
      .limit(limit),
  ]);

  return (
    <>
      <PageHeader
        title="Napló"
        subtitle={pet.name}
        icon={NotebookPen}
        action={
          <ButtonLink href="/naplo/kimutatas" variant="secondary">
            <BarChart3 size={18} aria-hidden="true" /> Kimutatás
          </ButtonLink>
        }
      />

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-surface p-1">
        <Link href={`/naplo?nap=${addDays(day, -1)}`} aria-label="Előző nap" className="flex size-11 items-center justify-center rounded-xl bg-surface-muted hover:bg-border">
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <div className="text-center">
          <p className="font-bold">{day === today ? "Ma" : formatDate(day)}</p>
          <p className="text-xs text-text-muted">{log ? "Kitöltve – módosítható" : "Még nincs kitöltve"}</p>
        </div>
        {day < today ? (
          <Link href={`/naplo?nap=${addDays(day, 1)}`} aria-label="Következő nap" className="flex size-11 items-center justify-center rounded-xl bg-surface-muted hover:bg-border">
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        ) : (
          <span className="size-11" />
        )}
      </div>

      <Card className="mb-8">
        <LogForm key={day} action={saveLog} petId={pet.id} day={day} log={log} />
      </Card>

      <SectionTitle icon={History}>Korábbi bejegyzések</SectionTitle>
      {recent?.length ? (
        <>
          <ul className="flex flex-col gap-3">
            {recent.map((l) => (
              <LogEntryCard key={l.id} log={l} />
            ))}
          </ul>
          <LoadMore shown={recent.length} total={count ?? 0} href={(n) => `/naplo?nap=${day}&db=${n}`} />
        </>
      ) : (
        <EmptyState>Még nincs korábbi bejegyzés.</EmptyState>
      )}
    </>
  );
}
