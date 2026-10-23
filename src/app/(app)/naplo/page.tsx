import Link from "next/link";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { LogForm } from "@/components/log-form";
import { ButtonLink, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatDate, formatShortDate, todayIso } from "@/lib/format";
import { observationLabel, SCALES, stoolLabel } from "@/lib/journal";
import { requireCurrentPet } from "@/lib/pets";
import { saveLog } from "./actions";

export const metadata = { title: "Napló" };

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ nap?: string }> }) {
  const pet = await requireCurrentPet();
  const { nap } = await searchParams;
  const today = todayIso();
  const day = nap && /^\d{4}-\d{2}-\d{2}$/.test(nap) && nap <= today ? nap : today;
  const supabase = await createClient();

  const [{ data: log }, { data: recent }] = await Promise.all([
    supabase.from("daily_logs").select("*").eq("pet_id", pet.id).eq("day", day).maybeSingle(),
    supabase.from("daily_logs").select("*").eq("pet_id", pet.id).neq("day", day).order("day", { ascending: false }).limit(10),
  ]);

  return (
    <>
      <PageHeader
        title="Napló"
        subtitle={pet.name}
        action={
          <ButtonLink href="/naplo/kimutatas" variant="secondary">
            <BarChart3 size={18} aria-hidden="true" /> Kimutatás
          </ButtonLink>
        }
      />

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-surface p-1">
        <Link href={`/naplo?nap=${addDays(day, -1)}`} aria-label="Előző nap" className="flex size-11 items-center justify-center rounded-xl hover:bg-surface-muted">
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <div className="text-center">
          <p className="font-bold">{day === today ? "Ma" : formatDate(day)}</p>
          <p className="text-xs text-text-muted">{log ? "Kitöltve – módosítható" : "Még nincs kitöltve"}</p>
        </div>
        {day < today ? (
          <Link href={`/naplo?nap=${addDays(day, 1)}`} aria-label="Következő nap" className="flex size-11 items-center justify-center rounded-xl hover:bg-surface-muted">
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        ) : (
          <span className="size-11" />
        )}
      </div>

      <Card className="mb-8">
        <LogForm key={day} action={saveLog} petId={pet.id} day={day} log={log} />
      </Card>

      <SectionTitle>Korábbi bejegyzések</SectionTitle>
      {recent?.length ? (
        <ul className="flex flex-col gap-2">
          {recent.map((l) => {
            const extras = [stoolLabel(l.stool), ...l.observations.map(observationLabel)].filter(Boolean);
            return (
              <li key={l.id}>
                <Link href={`/naplo?nap=${l.day}`} className="block rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-muted">
                  <p className="font-semibold">{formatShortDate(l.day)}</p>
                  <p className="text-sm text-text-muted">
                    {SCALES.filter((s) => l[s.key] !== null)
                      .map((s) => `${s.label.split(",")[0]} ${l[s.key]}`)
                      .join(" · ") || "Nincs értékelés"}
                  </p>
                  {extras.length > 0 && <p className="text-sm text-text-muted">{extras.join(", ")}</p>}
                  {l.notes && <p className="mt-1 line-clamp-2 text-sm">{l.notes}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>Még nincs korábbi bejegyzés.</EmptyState>
      )}
    </>
  );
}
