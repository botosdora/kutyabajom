"use client";

import { useState } from "react";
import { ActionForm, SubmitButton, type FormAction } from "@/components/forms";
import { Field, TextArea } from "@/components/ui";
import { SCALE_ICONS } from "@/components/scale-icons";
import { OBSERVATIONS, rateScale, SCALES, STOOL_OPTIONS, TONE_STYLE, type ScaleKey, type ScaleKind } from "@/lib/journal";
import type { Tables } from "@/lib/database.types";

function ScaleInput({
  name,
  label,
  low,
  high,
  kind,
  initial,
}: {
  name: ScaleKey;
  label: string;
  low: string;
  high: string;
  kind: ScaleKind;
  initial: number | null;
}) {
  const [value, setValue] = useState<number | null>(initial);
  const rating = value === null ? null : rateScale(kind, value);
  const style = rating ? TONE_STYLE[rating.tone] : null;
  const Icon = SCALE_ICONS[name];

  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-surface-muted/60 p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-surface text-link">
          <Icon size={18} aria-hidden="true" />
        </span>
        <label htmlFor={`scale-${name}`} className="flex-1 text-[15px] font-semibold">
          {label}
        </label>
        {rating && style ? (
          <span className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold ${style.badge}`}>
            <span className="text-base font-bold tabular-nums">{value}</span>
            {rating.word}
          </span>
        ) : (
          <span className="whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-sm font-medium text-text-muted">Nincs megadva</span>
        )}
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
      <input
        id={`scale-${name}`}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value ?? 5}
        data-empty={value === null}
        aria-valuetext={rating ? `${value}, ${rating.word}` : "Nincs megadva"}
        style={{ "--pct": `${(value ?? 5) * 10}%`, ...(style ? { "--fill": style.fill } : {}) } as React.CSSProperties}
        onChange={(e) => setValue(Number(e.target.value))}
        // A kezdőállás (5) is rögzül egy koppintással vagy a csúszka elengedésével.
        onPointerUp={(e) => setValue(Number(e.currentTarget.value))}
        onKeyUp={(e) => setValue(Number(e.currentTarget.value))}
        className="scale-range"
      />
      <div className="flex justify-between px-1 text-[11px] tabular-nums text-text-muted" aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className={`w-3 text-center ${i === value ? "font-bold text-text" : ""}`}>
            {i}
          </span>
        ))}
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span>{low}</span>
        {value !== null && (
          <button type="button" onClick={() => setValue(null)} className="rounded-md px-1.5 font-medium text-link">
            törlés
          </button>
        )}
        <span>{high}</span>
      </div>
    </div>
  );
}

function Chip({
  type,
  name,
  value,
  label,
  defaultChecked,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="flex h-10 items-center rounded-full border border-border-strong px-3.5 text-sm font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40">
        {label}
      </span>
    </label>
  );
}

export function LogForm({
  action,
  petId,
  day,
  log,
}: {
  action: FormAction;
  petId: string;
  day: string;
  log: Tables<"daily_logs"> | null;
}) {
  const [showPainDuration, setShowPainDuration] = useState(Boolean(log?.pain_duration));
  const [showWaterMl, setShowWaterMl] = useState(log?.water_ml != null);

  return (
    <ActionForm action={action} className="flex flex-col gap-6">
      <input type="hidden" name="pet_id" value={petId} />
      <input type="hidden" name="day" value={day} />

      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Értékelés 0-tól 10-ig</legend>
        {SCALES.map((s) => (
          <div key={s.key} className="flex flex-col gap-2">
            <ScaleInput
              name={s.key}
              label={s.label}
              low={s.low}
              high={s.high}
              kind={s.kind}
              initial={log?.[s.key] ?? null}
            />
            {s.key === "pain" &&
              (showPainDuration ? (
                <Field label="Fájdalom időtartama" name="pain_duration" defaultValue={log?.pain_duration ?? ""} placeholder="pl. 2 óra, egész délután" />
              ) : (
                <button type="button" onClick={() => setShowPainDuration(true)} className="self-start text-sm font-medium text-link">
                  + Időtartam megadása
                </button>
              ))}
            {s.key === "water" &&
              (showWaterMl ? (
                <Field label="Elfogyasztott víz (ml)" name="water_ml" type="number" min={0} inputMode="numeric" defaultValue={log?.water_ml ?? ""} />
              ) : (
                <button type="button" onClick={() => setShowWaterMl(true)} className="self-start text-sm font-medium text-link">
                  + Mennyiség ml-ben
                </button>
              ))}
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Széklet</legend>
        <div className="flex flex-wrap gap-2">
          {STOOL_OPTIONS.map((o) => (
            <Chip key={o.value} type="radio" name="stool" value={o.value} label={o.label} defaultChecked={log?.stool === o.value} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">További megfigyelések</legend>
        <div className="flex flex-wrap gap-2">
          {OBSERVATIONS.map((o) => (
            <Chip
              key={o.value}
              type="checkbox"
              name="observations"
              value={o.value}
              label={o.label}
              defaultChecked={log?.observations.includes(o.value) ?? false}
            />
          ))}
        </div>
      </fieldset>

      <TextArea label="Leírás" name="notes" rows={4} defaultValue={log?.notes ?? ""} placeholder="Bármi, ami ma feltűnt…" />
      <SubmitButton>Napló mentése</SubmitButton>
    </ActionForm>
  );
}
