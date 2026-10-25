"use client";

import Link from "next/link";
import { useState } from "react";
import { rateScale, SCALES, type ScaleKey } from "@/lib/journal";
import { formatShortDate } from "@/lib/format";

type Row = { day: string } & Record<ScaleKey, number | null>;

const MONTHS = ["jan", "feb", "márc", "ápr", "máj", "jún", "júl", "aug", "szept", "okt", "nov", "dec"];
const WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
// Egyszínű, világostól sötétig tartó skála (az érték nagysága), 5 fokozat.
const LEVELS = [18, 36, 56, 76, 100];

function level(value: number) {
  return Math.min(4, Math.floor(value / 2.2));
}

function cellColor(lvl: number) {
  return `color-mix(in oklab, var(--primary) ${LEVELS[lvl]}%, var(--surface))`;
}

// Hetek naptárszerűen (hétfőtől vasárnapig); minden nap egy négyzet, a színe a
// választott skála értéke. Koppintásra megnyílik az adott nap naplója.
export function JournalHeatmap({ logs, days, today }: { logs: Row[]; days: string[]; today: string }) {
  const [metric, setMetric] = useState<ScaleKey>("mood");
  const scale = SCALES.find((s) => s.key === metric)!;
  const byDay = new Map(logs.map((l) => [l.day, l]));

  return (
    <div>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1" role="radiogroup" aria-label="Melyik értéket mutassa?">
        {SCALES.map((s) => (
          <button
            key={s.key}
            type="button"
            role="radio"
            aria-checked={metric === s.key}
            onClick={() => setMetric(s.key)}
            className={`h-8 shrink-0 rounded-full px-3 text-sm font-medium ${
              metric === s.key ? "bg-primary text-on-primary" : "border border-border-strong hover:bg-surface-muted"
            }`}
          >
            {s.short}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-0.5 text-center text-[11px] font-semibold text-text-muted">
            {d}
          </span>
        ))}
        {days.map((day) => {
          if (day > today) return <span key={day} aria-hidden="true" />;
          const value = byDay.get(day)?.[metric] ?? null;
          const dayNum = Number(day.slice(8));
          const label =
            value === null
              ? `${formatShortDate(day)}: nincs adat`
              : `${formatShortDate(day)}: ${scale.short} ${value} (${rateScale(scale.kind, value).word.toLowerCase()})`;
          const lvl = value === null ? null : level(value);
          return (
            <Link
              key={day}
              href={`/naplo?nap=${day}`}
              title={label}
              aria-label={label}
              className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold tabular-nums hover:ring-2 hover:ring-primary/50 ${
                lvl === null ? "border border-dashed border-border-strong text-text-muted" : lvl >= 3 ? "text-on-primary" : "text-text"
              } ${day === today ? "ring-2 ring-text ring-offset-1 ring-offset-surface" : ""}`}
              style={lvl === null ? undefined : { background: cellColor(lvl) }}
            >
              {dayNum === 1 ? MONTHS[Number(day.slice(5, 7)) - 1] : dayNum}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-text-muted">
        <span>{scale.low}</span>
        {LEVELS.map((_, i) => (
          <span key={i} className="size-3.5 rounded-sm" style={{ background: cellColor(i) }} aria-hidden="true" />
        ))}
        <span>{scale.high}</span>
      </div>
    </div>
  );
}
