"use client";

import { useState } from "react";
import { ActionForm, SubmitButton, type FormAction } from "@/components/forms";
import { Field, Select, TextArea } from "@/components/ui";
import type { Tables } from "@/lib/database.types";

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
        <Field label="Dátum" name="event_date" type="date" defaultValue={event?.event_date ?? defaultDate} required />
        <Field label="Időpont" name="event_time" type="time" defaultValue={event?.event_time?.slice(0, 5) ?? ""} />
      </div>
      {category === "orvosi" && <Select label="Orvos" name="vet_id" defaultValue={event?.vet_id ?? ""} options={vets} />}
      <Field label="Helyszín" name="location" defaultValue={event?.location ?? ""} />
      <TextArea label="Megjegyzés" name="notes" defaultValue={event?.notes ?? ""} />
      <SubmitButton>Mentés</SubmitButton>
    </ActionForm>
  );
}
