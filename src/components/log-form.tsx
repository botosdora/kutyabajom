"use client";

import { useState } from "react";
import { ActionForm, SubmitButton, type FormAction } from "@/components/forms";
import { Field, TextArea } from "@/components/ui";
import { OBSERVATIONS, SCALES, STOOL_OPTIONS } from "@/lib/journal";
import type { Tables } from "@/lib/database.types";

function ScaleInput({
  name,
  label,
  low,
  high,
  inverted,
  initial,
}: {
  name: string;
  label: string;
  low: string;
  high: string;
  inverted: boolean;
  initial: number | null;
}) {
  const [value, setValue] = useState<number | null>(initial);
  const tone =
    value === null ? "text-text-muted" : (inverted ? value >= 6 : value <= 3) ? "text-danger" : "text-text";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={`scale-${name}`} className="text-sm font-medium">
          {label}
        </label>
        <span className={`text-lg font-bold tabular-nums ${tone}`}>
          {value ?? "–"}
          <span className="text-xs font-medium text-text-muted"> / 10</span>
        </span>
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
      <input
        id={`scale-${name}`}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value ?? 5}
        onChange={(e) => setValue(Number(e.target.value))}
        // A kezdőállás (5) is rögzül egy koppintással vagy a csúszka elengedésével.
        onPointerUp={(e) => setValue(Number(e.currentTarget.value))}
        onKeyUp={(e) => setValue(Number(e.currentTarget.value))}
        className={`h-8 w-full accent-primary ${value === null ? "opacity-40" : ""}`}
      />
      <div className="flex justify-between text-xs text-text-muted">
        <span>0 – {low}</span>
        {value !== null && (
          <button type="button" onClick={() => setValue(null)} className="font-medium text-link">
            törlés
          </button>
        )}
        <span>10 – {high}</span>
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

      <fieldset className="flex flex-col gap-5">
        <legend className="sr-only">Értékelés 0-tól 10-ig</legend>
        {SCALES.map((s) => (
          <div key={s.key} className="flex flex-col gap-2">
            <ScaleInput
              name={s.key}
              label={s.label}
              low={s.low}
              high={s.high}
              inverted={s.inverted}
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
