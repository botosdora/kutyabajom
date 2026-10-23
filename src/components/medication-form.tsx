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
                scheduleType === t.value ? "bg-surface text-primary shadow-sm" : "text-text-muted"
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
          defaultValue={medication?.start_date ?? today}
          required
        />
        {scheduleType === "course" && (
          <Field label="Befejezés" name="end_date" type="date" defaultValue={medication?.end_date ?? ""} required />
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
          className="flex h-10 items-center gap-1 self-start rounded-lg px-2 text-sm font-semibold text-primary hover:bg-surface-muted"
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
