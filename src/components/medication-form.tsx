"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { ActionForm, SubmitButton, type FormAction } from "@/components/forms";
import { Field, Select, TextArea } from "@/components/ui";
import type { Tables } from "@/lib/database.types";

const SCHEDULE_TYPES = [
  { value: "once", label: "Egyszeri" },
  { value: "recurring", label: "Ismétlődő" },
  { value: "course", label: "Kúra" },
];

const COURSE_PRESETS = [
  { label: "1 hét", days: 7 },
  { label: "2 hét", days: 14 },
  { label: "1 hónap", months: 1 },
  { label: "3 hónap", months: 3 },
  { label: "6 hónap", months: 6 },
];

// A kúra utolsó napja: a kezdéstől számított időtartam előtti nap
// (pl. 1 hónap 11.01-től → 11.30.).
function addToDate(start: string, preset: { days?: number; months?: number }) {
  const d = new Date(`${start}T12:00:00Z`);
  if (preset.months) {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + preset.months);
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, lastDay));
  }
  if (preset.days) d.setUTCDate(d.getUTCDate() + preset.days);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function MedicationForm({
  action,
  petId,
  medication,
  categories,
  today,
  submitLabel = "Mentés",
}: {
  action: FormAction;
  petId: string;
  medication?: Tables<"medications">;
  categories: { value: string; label: string }[];
  today: string;
  submitLabel?: string;
}) {
  const [scheduleType, setScheduleType] = useState(medication?.schedule_type ?? "recurring");
  const [times, setTimes] = useState<string[]>(medication?.times.map((t) => t.slice(0, 5)) ?? ["08:00"]);
  const [startDate, setStartDate] = useState(medication?.start_date ?? today);
  const [endDate, setEndDate] = useState(medication?.end_date ?? "");

  return (
    <ActionForm action={action}>
      <input type="hidden" name="pet_id" value={petId} />
      {medication && <input type="hidden" name="id" value={medication.id} />}

      <Field label="Megnevezés" name="name" defaultValue={medication?.name} placeholder="pl. NexGard Spectra" required />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Kategória" name="category" defaultValue={medication?.category ?? "gyogyszer"} options={categories} />
        <Field label="Adag" name="dosage" defaultValue={medication?.dosage ?? ""} placeholder="pl. 1 tabletta" />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Ütemezés</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1">
          {SCHEDULE_TYPES.map((t) => (
            <label
              key={t.value}
              className={`flex h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold ${
                scheduleType === t.value ? "bg-surface text-link shadow-sm" : "text-text-muted"
              }`}
            >
              <input
                type="radio"
                name="schedule_type"
                value={t.value}
                checked={scheduleType === t.value}
                onChange={() => setScheduleType(t.value)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={scheduleType === "once" ? "Dátum" : "Kezdés"}
          name="start_date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        {scheduleType === "course" && (
          <Field
            label="Befejezés"
            name="end_date"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        )}
        {scheduleType !== "once" && (
          <Field
            label="Hány naponta?"
            name="interval_days"
            type="number"
            min={1}
            defaultValue={medication?.interval_days ?? 1}
            hint="1 = minden nap, 28 = négyhetente"
          />
        )}
      </div>

      {scheduleType === "course" && startDate && (
        <div className="-mt-2 flex flex-wrap gap-2" aria-label="Kúra hossza">
          {COURSE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setEndDate(addToDate(startDate, p))}
              className="h-9 rounded-full border border-border-strong px-3 text-sm font-medium hover:bg-surface-muted"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Időpont(ok) aznap</legend>
        {times.map((time, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="time"
              name="times"
              value={time}
              onChange={(e) => setTimes(times.map((t, j) => (j === i ? e.target.value : t)))}
              required
              aria-label={`${i + 1}. időpont`}
              className="h-11 flex-1 rounded-xl border border-border-strong bg-surface px-3 text-[15px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            {times.length > 1 && (
              <button
                type="button"
                aria-label="Időpont törlése"
                onClick={() => setTimes(times.filter((_, j) => j !== i))}
                className="flex size-11 items-center justify-center rounded-xl text-text-muted hover:bg-surface-muted"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTimes([...times, "20:00"])}
          className="flex h-10 items-center gap-1 self-start rounded-lg px-2 text-sm font-semibold text-link hover:bg-surface-muted"
        >
          <Plus size={16} aria-hidden="true" /> Még egy időpont
        </button>
      </fieldset>

      <Field
        label="Újravásárlás esedékes"
        name="reorder_on"
        type="date"
        defaultValue={medication?.reorder_on ?? ""}
        hint="7 nappal előtte figyelmeztetünk a főoldalon."
      />
      <TextArea label="Megjegyzés" name="notes" defaultValue={medication?.notes ?? ""} placeholder="pl. étellel együtt" />

      <SubmitButton>{submitLabel}</SubmitButton>
    </ActionForm>
  );
}
