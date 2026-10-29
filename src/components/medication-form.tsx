"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { ActionForm, SubmitButton, type FormAction } from "@/components/forms";
import { Field, Select, TextArea } from "@/components/ui";
import type { Medication, Period } from "@/lib/medications";
import { MED_CATEGORIES, STOP_REASONS } from "@/lib/medications";

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

const inputClass =
  "h-11 flex-1 rounded-xl border border-border-strong bg-surface px-3 text-[15px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

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

// Egy időszak ütemezése: dátum(ok), gyakoriság, időpontok.
// Egyszerinél új gyógyszer felvételekor több dátum is megadható.
function ScheduleFields({
  scheduleType,
  period,
  today,
  multipleOnceDates = false,
}: {
  scheduleType: string;
  period?: Partial<Period>;
  today: string;
  multipleOnceDates?: boolean;
}) {
  const [times, setTimes] = useState<string[]>(period?.times?.map((t) => t.slice(0, 5)) ?? ["08:00"]);
  const [startDate, setStartDate] = useState(period?.start_date ?? today);
  const [endDate, setEndDate] = useState(period?.end_date ?? "");
  const [onceDates, setOnceDates] = useState<string[]>([period?.start_date ?? today]);

  return (
    <>
      {scheduleType === "once" && multipleOnceDates ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium">Dátum(ok)</legend>
          {onceDates.map((date, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="date"
                name="once_dates"
                value={date}
                onChange={(e) => setOnceDates(onceDates.map((d, j) => (j === i ? e.target.value : d)))}
                required
                aria-label={`${i + 1}. alkalom`}
                className={inputClass}
              />
              {onceDates.length > 1 && (
                <button
                  type="button"
                  aria-label="Alkalom törlése"
                  onClick={() => setOnceDates(onceDates.filter((_, j) => j !== i))}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-muted hover:bg-border"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOnceDates([...onceDates, today])}
            className="flex h-10 items-center gap-1 self-start rounded-lg bg-primary-soft px-3 text-sm font-semibold text-link hover:opacity-80"
          >
            <Plus size={16} aria-hidden="true" /> Még egy alkalom
          </button>
        </fieldset>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={scheduleType === "once" ? "Dátum" : "Kezdés"}
            name="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          {scheduleType !== "once" && (
            <Field
              label={scheduleType === "course" ? "Befejezés" : "Befejezés (ha tudod)"}
              name="end_date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              required={scheduleType === "course"}
            />
          )}
          {scheduleType !== "once" && (
            <Field
              label="Hány naponta?"
              name="interval_days"
              type="number"
              min={1}
              defaultValue={period?.interval_days ?? 1}
              hint="1 = minden nap, 28 = négyhetente"
            />
          )}
        </div>
      )}

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
              className={inputClass}
            />
            {times.length > 1 && (
              <button
                type="button"
                aria-label="Időpont törlése"
                onClick={() => setTimes(times.filter((_, j) => j !== i))}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-muted hover:bg-border"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTimes([...times, "20:00"])}
          className="flex h-10 items-center gap-1 self-start rounded-lg bg-primary-soft px-3 text-sm font-semibold text-link hover:opacity-80"
        >
          <Plus size={16} aria-hidden="true" /> Még egy időpont
        </button>
      </fieldset>
    </>
  );
}

function BasicFields({ medication }: { medication?: Medication }) {
  return (
    <>
      <Field label="Megnevezés" name="name" defaultValue={medication?.name} placeholder="pl. NexGard Spectra" required />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Kategória" name="category" defaultValue={medication?.category ?? "gyogyszer"} options={MED_CATEGORIES} />
        <Field label="Adag" name="dosage" defaultValue={medication?.dosage ?? ""} placeholder="pl. 1 tabletta" />
      </div>
    </>
  );
}

function ExtraFields({ medication }: { medication?: Medication }) {
  return (
    <>
      <Field
        label="Újravásárlás esedékes"
        name="reorder_on"
        type="date"
        defaultValue={medication?.reorder_on ?? ""}
        hint="7 nappal előtte figyelmeztetünk a főoldalon."
      />
      <TextArea label="Megjegyzés" name="notes" defaultValue={medication?.notes ?? ""} placeholder="pl. étellel együtt" />
    </>
  );
}

// Új gyógyszer: alapadatok és az első időszak (vagy egyszerinél az alkalmak).
export function MedicationForm({ action, petId, today }: { action: FormAction; petId: string; today: string }) {
  const [scheduleType, setScheduleType] = useState("recurring");

  return (
    <ActionForm action={action}>
      <input type="hidden" name="pet_id" value={petId} />
      <BasicFields />

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

      <ScheduleFields key={scheduleType} scheduleType={scheduleType} today={today} multipleOnceDates />
      <ExtraFields />
      <SubmitButton>Mentés</SubmitButton>
    </ActionForm>
  );
}

// A gyógyszer alapadatai (az ütemezés időszakonként szerkeszthető).
export function MedicationDetailsForm({ action, medication }: { action: FormAction; medication: Medication }) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name="id" value={medication.id} />
      <BasicFields medication={medication} />
      <ExtraFields medication={medication} />
      <SubmitButton>Mentés</SubmitButton>
    </ActionForm>
  );
}

// Egy időszak (kúra, alkalom) felvétele vagy módosítása.
export function PeriodForm({
  action,
  medication,
  period,
  defaults,
  today,
}: {
  action: FormAction;
  medication: Medication;
  period?: Period;
  defaults?: Partial<Period>;
  today: string;
}) {
  const scheduleType = medication.schedule_type;
  const [ended, setEnded] = useState(Boolean(period?.end_date));
  return (
    <ActionForm action={action}>
      <input type="hidden" name="medication_id" value={medication.id} />
      <input type="hidden" name="pet_id" value={medication.pet_id} />
      <input type="hidden" name="schedule_type" value={scheduleType} />
      {period && <input type="hidden" name="id" value={period.id} />}
      <div className="contents" onChange={(e) => (e.target as HTMLInputElement).name === "end_date" && setEnded(Boolean((e.target as HTMLInputElement).value))}>
        <ScheduleFields scheduleType={scheduleType} period={period ?? defaults} today={today} />
      </div>
      <Field
        label="Adag ebben az időszakban"
        name="period_dosage"
        defaultValue={period?.dosage ?? defaults?.dosage ?? ""}
        placeholder={medication.dosage ?? "pl. 10 mg"}
        hint={medication.dosage ? `Ha üres, a megszokott adag: ${medication.dosage}` : undefined}
      />
      {period && scheduleType !== "once" && ended && (
        <Select
          label="Miért hagyta abba?"
          name="stop_reason"
          defaultValue={period.stop_reason ?? ""}
          options={[{ value: "", label: "–" }, ...STOP_REASONS]}
        />
      )}
      <SubmitButton>Mentés</SubmitButton>
    </ActionForm>
  );
}
