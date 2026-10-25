"use client";

import Link from "next/link";
import { useState } from "react";
import { Cake, FileText, FlaskConical, Scale, ShieldAlert, Stethoscope, Syringe } from "lucide-react";
import { formatShortDate } from "@/lib/format";

export type TimelineEntry = {
  key: string;
  date: string;
  kind: keyof typeof KINDS;
  title: string;
  detail: string | null;
  href: string;
};

// Fajtánként rögzített ikon, felirat és szín (a kategóriás paletta sorrendjében).
const KINDS = {
  medical: { label: "Orvosi", icon: Stethoscope, color: "var(--series-1)" },
  vaccine: { label: "Oltás", icon: Syringe, color: "var(--series-3)" },
  weight: { label: "Súly", icon: Scale, color: "var(--series-4)" },
  lab: { label: "Labor", icon: FlaskConical, color: "var(--series-7)" },
  document: { label: "Dokumentum", icon: FileText, color: "var(--series-5)" },
  condition: { label: "Diagnózis", icon: ShieldAlert, color: "var(--series-2)" },
  milestone: { label: "Mérföldkő", icon: Cake, color: "var(--primary)" },
};

// A kutya élete egy görgethető vonalon, évenként tagolva; fajtánként szűrhető.
export function HealthTimeline({ entries }: { entries: TimelineEntry[] }) {
  const [filter, setFilter] = useState<TimelineEntry["kind"] | "all">("all");
  const present = (Object.keys(KINDS) as TimelineEntry["kind"][]).filter((k) => entries.some((e) => e.kind === k));
  const shown = filter === "all" ? entries : entries.filter((e) => e.kind === filter);

  const years: { year: string; items: TimelineEntry[] }[] = [];
  for (const e of shown) {
    const year = e.date.slice(0, 4);
    const last = years[years.length - 1];
    if (last?.year === year) last.items.push(e);
    else years.push({ year, items: [e] });
  }

  return (
    <div>
      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1" role="radiogroup" aria-label="Szűrés">
        {(["all", ...present] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={filter === k}
            onClick={() => setFilter(k)}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium ${
              filter === k ? "bg-primary text-on-primary" : "border border-border-strong hover:bg-surface-muted"
            }`}
          >
            {k !== "all" && (
              <span className="size-2 rounded-full" style={{ background: KINDS[k].color }} aria-hidden="true" />
            )}
            {k === "all" ? "Mind" : KINDS[k].label}
            <span className={filter === k ? "opacity-80" : "text-text-muted"}>
              {k === "all" ? entries.length : entries.filter((e) => e.kind === k).length}
            </span>
          </button>
        ))}
      </div>

      {years.map(({ year, items }) => (
        <section key={year} className="mb-4">
          <h2 className="sticky top-16 z-10 -mx-1 mb-2 bg-bg/95 px-1 py-1.5 text-lg font-bold backdrop-blur md:top-0">{year}</h2>
          <ol className="relative">
            <span aria-hidden="true" className="absolute bottom-4 left-[19px] top-4 w-0.5 rounded-full bg-border" />
            {items.map((e) => {
              const { icon: Icon, color, label } = KINDS[e.kind];
              return (
                <li key={e.key} className="relative pb-2">
                  <Link href={e.href} className="group flex items-start gap-3">
                    <span
                      className="relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-full bg-surface ring-4 ring-bg"
                      style={{ boxShadow: `inset 0 0 0 2px ${color}`, color }}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 rounded-2xl border border-border bg-surface px-3.5 py-2.5 group-hover:bg-surface-muted">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="min-w-0 truncate font-semibold">{e.title}</span>
                        <span className="shrink-0 text-xs font-medium tabular-nums text-text-muted">{formatShortDate(e.date)}</span>
                      </span>
                      <span className="block truncate text-sm text-text-muted">
                        {label}
                        {e.detail && ` · ${e.detail}`}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
