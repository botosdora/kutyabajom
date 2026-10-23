"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { AddPanel, type FormAction } from "@/components/forms";
import { Field, Select } from "@/components/ui";
import { LAB_PRESETS } from "@/lib/labs";

type Row = { id: number; parameter: string; unit: string; low: string; high: string };
let nextId = 1;
const emptyRow = (): Row => ({ id: nextId++, parameter: "", unit: "", low: "", high: "" });

const inputClass =
  "h-10 w-full rounded-lg border border-border-strong bg-surface px-2.5 text-[15px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

// Lelet felvitele: soronként egy paraméter. Ismert paraméternél az egység és a
// tájékoztató tartomány kitöltődik (a leletről átírható).
export function LabForm({
  action,
  petId,
  today,
  events,
  known,
}: {
  action: FormAction;
  petId: string;
  today: string;
  events: { value: string; label: string }[];
  known: { name: string; unit: string | null; low: number | null; high: number | null }[];
}) {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const suggestions = [...known, ...LAB_PRESETS.filter((p) => !known.some((k) => k.name === p.name))];

  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const pickParameter = (id: number, name: string) => {
    const preset = suggestions.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    update(id, {
      parameter: name,
      ...(preset ? { unit: preset.unit ?? "", low: preset.low?.toString() ?? "", high: preset.high?.toString() ?? "" } : {}),
    });
  };

  return (
    <AddPanel label="Új lelet felvitele" action={action}>
      <input type="hidden" name="pet_id" value={petId} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lelet dátuma" name="measured_on" type="date" defaultValue={today} required />
        <Select label="Vizsgálat" name="medical_event_id" options={[{ value: "", label: "–" }, ...events]} />
      </div>
      <datalist id="lab-parameters">
        {suggestions.map((p) => (
          <option key={p.name} value={p.name} />
        ))}
      </datalist>
      <div className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <fieldset key={r.id} className="rounded-xl border border-border bg-surface p-3">
            <legend className="sr-only">{i + 1}. érték</legend>
            <div className="mb-2 flex gap-2">
              <input
                name="parameter"
                list="lab-parameters"
                value={r.parameter}
                onChange={(e) => pickParameter(r.id, e.target.value)}
                placeholder="Paraméter, pl. ALT"
                aria-label="Paraméter"
                className={inputClass}
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  aria-label="Sor törlése"
                  onClick={() => setRows(rows.filter((x) => x.id !== r.id))}
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-muted"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-[1.2fr_1fr] gap-2">
              <input name="value" inputMode="decimal" placeholder="Érték" aria-label="Érték" className={inputClass} />
              <input name="unit" value={r.unit} onChange={(e) => update(r.id, { unit: e.target.value })} placeholder="Egység" aria-label="Egység" className={inputClass} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input name="ref_low" inputMode="decimal" value={r.low} onChange={(e) => update(r.id, { low: e.target.value })} placeholder="Ref. alsó" aria-label="Referencia alsó határ" className={inputClass} />
              <input name="ref_high" inputMode="decimal" value={r.high} onChange={(e) => update(r.id, { high: e.target.value })} placeholder="Ref. felső" aria-label="Referencia felső határ" className={inputClass} />
            </div>
          </fieldset>
        ))}
        <button
          type="button"
          onClick={() => setRows([...rows, emptyRow()])}
          className="flex h-10 items-center gap-1 self-start rounded-lg bg-primary-soft px-3 text-sm font-semibold text-link"
        >
          <Plus size={16} aria-hidden="true" /> Még egy érték
        </button>
        <p className="text-xs text-text-muted">A referenciatartomány laboronként eltér: ha a leleten más szerepel, írd át.</p>
      </div>
    </AddPanel>
  );
}
