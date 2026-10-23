import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SCALE_ICONS } from "@/components/scale-icons";
import { observationLabel, rateScale, SCALES, stoolLabel, TONE_STYLE } from "@/lib/journal";
import type { Tables } from "@/lib/database.types";

const weekday = new Intl.DateTimeFormat("hu-HU", { weekday: "long", timeZone: "UTC" });
const monthDay = new Intl.DateTimeFormat("hu-HU", { month: "long", day: "numeric", timeZone: "UTC" });

// Egy naplóbejegyzés áttekinthető kártyán: értékek csempékben, megfigyelések címkékben.
export function LogEntryCard({ log }: { log: Tables<"daily_logs"> }) {
  const date = new Date(`${log.day}T12:00:00Z`);
  const tags = [stoolLabel(log.stool) && `Széklet: ${stoolLabel(log.stool)}`, ...log.observations.map(observationLabel)].filter(
    Boolean,
  ) as string[];
  const scales = SCALES.filter((s) => log[s.key] !== null);

  return (
    <li>
      <Link href={`/naplo?nap=${log.day}`} className="block rounded-2xl border border-border bg-surface p-4 hover:border-border-strong">
        <div className="mb-3 flex items-center justify-between">
          <p>
            <span className="font-bold">{monthDay.format(date)}</span>
            <span className="text-sm text-text-muted"> · {weekday.format(date)}</span>
          </p>
          <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
        </div>

        {scales.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {scales.map((s) => {
              const value = log[s.key]!;
              const rating = rateScale(s.kind, value);
              const Icon = SCALE_ICONS[s.key];
              return (
                <div key={s.key} className={`rounded-xl px-2.5 py-2 ${TONE_STYLE[rating.tone].badge}`}>
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase opacity-80">
                    <Icon size={12} aria-hidden="true" />
                    {s.short}
                  </p>
                  <p className="text-lg font-bold leading-tight tabular-nums">
                    {value}
                    <span className="ml-1 text-xs font-semibold">{rating.word}</span>
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Nincs értékelés.</p>
        )}

        {(log.pain_duration || log.water_ml != null) && (
          <p className="mt-2 text-xs text-text-muted">
            {[log.pain_duration && `Fájdalom: ${log.pain_duration}`, log.water_ml != null && `Víz: ${log.water_ml} ml`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium">
                {t}
              </span>
            ))}
          </div>
        )}

        {log.notes && <p className="mt-3 whitespace-pre-line rounded-xl bg-surface-muted px-3 py-2 text-sm">{log.notes}</p>}
      </Link>
    </li>
  );
}
