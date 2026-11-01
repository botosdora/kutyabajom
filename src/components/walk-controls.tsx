"use client";

import { useState } from "react";
import { PawPrint, Plus, Settings2, X } from "lucide-react";
import { addExtraWalk, updateWalkTimes } from "@/app/(app)/today-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { SheetLauncher } from "@/components/sheet";
import { Field } from "@/components/ui";

function nowTime() {
  return new Intl.DateTimeFormat("hu-HU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Budapest" }).format(new Date());
}

// Séták a teendők alatt: extra séta rögzítése és a napi séták időpontjai.
export function WalkControls({ petId, day, walkTimes, isToday }: { petId: string; day: string; walkTimes: string[]; isToday: boolean }) {
  const [times, setTimes] = useState(walkTimes.map((t) => t.slice(0, 5)));
  const linkClass = "flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-link hover:bg-primary-soft";

  return (
    <div className="flex flex-wrap gap-1">
      {walkTimes.length > 0 && (
        <SheetLauncher
          title="Extra séta"
          label="Extra séta"
          icon={<PawPrint size={16} aria-hidden="true" />}
          variant="ghost"
          className={linkClass}
        >
          <ActionForm action={addExtraWalk}>
            <input type="hidden" name="pet_id" value={petId} />
            <input type="hidden" name="day" value={day} />
            <Field label="Időpont" name="time" type="time" defaultValue={isToday ? nowTime() : "12:00"} required />
            <div className="flex gap-2">
              <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-strong text-sm font-semibold has-checked:border-primary has-checked:bg-primary-soft has-checked:text-link">
                <input type="checkbox" name="pee" className="size-4 accent-[var(--primary)]" /> Pisi
              </label>
              <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-strong text-sm font-semibold has-checked:border-primary has-checked:bg-primary-soft has-checked:text-link">
                <input type="checkbox" name="poop" className="size-4 accent-[var(--primary)]" /> Kaki
              </label>
            </div>
            <SubmitButton>Mentés</SubmitButton>
          </ActionForm>
        </SheetLauncher>
      )}
      <SheetLauncher
        title="Séták időpontjai"
        label={walkTimes.length ? "Séták időpontjai" : "Séták rögzítése"}
        icon={<Settings2 size={16} aria-hidden="true" />}
        variant="ghost"
        className={linkClass}
      >
        <ActionForm action={updateWalkTimes}>
          <input type="hidden" name="pet_id" value={petId} />
          <p className="text-sm text-text-muted">
            Ezekben az időpontokban jelenik meg a séta a teendők között; sétánként jelölheted a pisit és a kakit. A séták nem számítanak bele a napi
            teendők számába.
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
      </SheetLauncher>
    </div>
  );
}
