"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addExtraWalk, updateWalkTimes } from "@/app/(app)/today-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";

function nowTime() {
  return new Intl.DateTimeFormat("hu-HU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Budapest" }).format(new Date());
}

// Extra séta rögzítése (a főoldali Hozzáadás menüből).
export function ExtraWalkForm({ petId, day, onSuccess, children }: { petId: string; day: string; onSuccess?: () => void; children?: React.ReactNode }) {
  return (
    <ActionForm action={addExtraWalk} onSuccess={onSuccess}>
      <input type="hidden" name="pet_id" value={petId} />
      <input type="hidden" name="day" value={day} />
      <Field label="Időpont" name="time" type="time" defaultValue={nowTime()} required />
      <div className="flex gap-2">
        <label className={CHECK_CLASS}>
          <input type="checkbox" name="pee" className="size-4 accent-[var(--primary)]" /> Pisi
        </label>
        <label className={CHECK_CLASS}>
          <input type="checkbox" name="poop" className="size-4 accent-[var(--primary)]" /> Kaki
        </label>
      </div>
      {children ?? <SubmitButton>Mentés</SubmitButton>}
    </ActionForm>
  );
}

const CHECK_CLASS =
  "flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-strong text-sm font-semibold has-checked:border-primary has-checked:bg-primary-soft has-checked:text-link";

// A napi séták időpontjai (Egyéb oldal). Üresen hagyva nincsenek séták.
export function WalkTimesForm({ petId, walkTimes }: { petId: string; walkTimes: string[] }) {
  const [times, setTimes] = useState(walkTimes.map((t) => t.slice(0, 5)));
  return (
    <ActionForm action={updateWalkTimes}>
      <input type="hidden" name="pet_id" value={petId} />
      <p className="text-sm text-text-muted">
        Ezekben az időpontokban jelenik meg a séta a főoldali teendők között; sétánként jelölheted a pisit és a kakit. A séták nem számítanak
        bele a napi teendők számába.
      </p>
      {times.map((time, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="time"
            name="walk_times"
            value={time}
            onChange={(e) => setTimes(times.map((t, j) => (j === i ? e.target.value : t)))}
            required
            aria-label={`${i + 1}. séta`}
            className="h-11 flex-1 rounded-xl border border-border-strong bg-surface px-3 text-[15px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
          <button
            type="button"
            aria-label="Séta törlése"
            onClick={() => setTimes(times.filter((_, j) => j !== i))}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-muted hover:bg-border"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setTimes([...times, times.length ? "12:00" : "08:00"])}
        className="flex h-10 items-center gap-1 self-start rounded-lg bg-primary-soft px-3 text-sm font-semibold text-link hover:opacity-80"
      >
        <Plus size={16} aria-hidden="true" /> Séta hozzáadása
      </button>
      <SubmitButton>Mentés</SubmitButton>
    </ActionForm>
  );
}
