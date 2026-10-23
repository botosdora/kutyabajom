"use client";

import { useState } from "react";
import { ActionForm, SubmitButton, type FormAction } from "@/components/forms";
import { Field, Select, TextArea } from "@/components/ui";
import type { Tables } from "@/lib/database.types";
import { REPEAT_RULES } from "@/lib/calendar";

type Option = { value: string; label: string };

export function EventForm({
  action,
  petId,
  event,
  vetTypes,
  taskTypes,
  vets,
  defaultDate,
  defaultCategory = "orvosi",
}: {
  action: FormAction;
  petId: string;
  event?: Tables<"calendar_events">;
  vetTypes: Option[];
  taskTypes: Option[];
  vets: Option[];
  defaultDate: string;
  defaultCategory?: "orvosi" | "feladat";
}) {
  const [category, setCategory] = useState(event?.category ?? defaultCategory);
  const [taskType, setTaskType] = useState(event?.task_type_id ?? taskTypes[0]?.value ?? "__new");
  const [date, setDate] = useState(event?.event_date ?? defaultDate);
  const [repeatRule, setRepeatRule] = useState("");
  const [repeatUntil, setRepeatUntil] = useState("");

  const changeRule = (rule: string) => {
    setRepeatRule(rule);
    // Ésszerű alapértelmezett vég: naponta 1 hónap, hetente 3 hónap, havonta 1 év, évente 3 év.
    const days = { daily: 30, weekly: 90, monthly: 365, yearly: 365 * 3 }[rule];
    if (days && date) setRepeatUntil(new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10));
  };

  return (
    <ActionForm action={action}>
      <input type="hidden" name="pet_id" value={petId} />
      {event && <input type="hidden" name="id" value={event.id} />}

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1" role="radiogroup" aria-label="Esemény fajtája">
        {[
          { value: "orvosi", label: "Orvosi" },
          { value: "feladat", label: "Egyéb feladat" },
        ].map((c) => (
          <label
            key={c.value}
            className={`flex h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold ${
              category === c.value ? "bg-surface text-link shadow-sm" : "text-text-muted"
            }`}
          >
            <input
              type="radio"
              name="category"
              value={c.value}
              checked={category === c.value}
              onChange={() => setCategory(c.value as "orvosi" | "feladat")}
              className="sr-only"
            />
            {c.label}
          </label>
        ))}
      </div>

      {category === "orvosi" ? (
        <Select label="Típus" name="vet_type" defaultValue={event?.vet_type ?? "vizsgalat"} options={vetTypes} />
      ) : (
        <>
          <Select
            label="Feladattípus"
            name="task_type_id"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            options={[...taskTypes, { value: "__new", label: "+ Új típus…" }]}
          />
          {taskType === "__new" && (
            <Field label="Új típus neve" name="new_task_type" placeholder="pl. fizioterápia, agility, kozmetika" required />
          )}
        </>
      )}

      <Field
        label="Megnevezés"
        name="title"
        defaultValue={event?.title}
        placeholder={category === "orvosi" ? "pl. Éves kontroll, veszettség oltás" : "Ha üres, a típus neve lesz"}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dátum" name="event_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Field label="Időpont" name="event_time" type="time" defaultValue={event?.event_time?.slice(0, 5) ?? ""} />
      </div>
      {!event && (
        <div className="flex flex-col gap-3 rounded-xl bg-surface-muted p-3">
          <Select label="Ismétlődés" name="repeat_rule" value={repeatRule} onChange={(e) => changeRule(e.target.value)} options={REPEAT_RULES} />
          {repeatRule && (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={`Hány ${{ daily: "naponta", weekly: "hetente", monthly: "havonta", yearly: "évente" }[repeatRule]}?`}
                name="repeat_interval"
                type="number"
                min={1}
                defaultValue={1}
                hint="1 = minden alkalommal"
              />
              <Field
                label="Utolsó alkalom legkésőbb"
                name="repeat_until"
                type="date"
                min={date}
                value={repeatUntil}
                onChange={(e) => setRepeatUntil(e.target.value)}
                required
              />
            </div>
          )}
        </div>
      )}
      {event?.series_id && (
        <p className="text-xs text-text-muted">Ez egy ismétlődő sorozat egyik alkalma; a módosítás csak erre az alkalomra vonatkozik.</p>
      )}
      {category === "orvosi" && <Select label="Orvos" name="vet_id" defaultValue={event?.vet_id ?? ""} options={vets} />}
      <Field label="Helyszín" name="location" defaultValue={event?.location ?? ""} />
      <TextArea label="Megjegyzés" name="notes" defaultValue={event?.notes ?? ""} />
      <SubmitButton>Mentés</SubmitButton>
    </ActionForm>
  );
}
