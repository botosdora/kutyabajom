"use client";

import { useState, useTransition } from "react";
import { CircleStop } from "lucide-react";
import { stopMedication, undoStopMedication } from "@/app/(app)/gyogyszerek/actions";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { Alert, buttonClass, Field } from "@/components/ui";
import { STOP_REASONS } from "@/lib/medications";

// "Már nem szedi": az utolsó nap és az ok megadása. A folyamatban lévő időszak
// lezárul (az előzmény megmarad); a felugró üzenetből visszavonható.
export function StopMedication({ medicationId, name, today, showReason }: { medicationId: string; name: string; today: string; showReason: boolean }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [reason, setReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await stopMedication(medicationId, date, showReason ? reason : null);
      if ("error" in result) return setError(result.error);
      setOpen(false);
      toast(`${name}: abbahagyva`, {
        label: "Visszavonás",
        onClick: () =>
          startTransition(async () => {
            await undoStopMedication(result);
            toast("Visszavonva.");
          }),
      });
    });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={buttonClass("secondary")}>
        <CircleStop size={18} aria-hidden="true" /> Már nem szedi
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`${name} abbahagyása`}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">Az eddigi adagok megmaradnak a naplóban; az utolsó nap után nem jelenik meg több teendő.</p>
          <Field label="Utolsó nap" name="date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
          {showReason && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Miért hagyta abba? (nem kötelező)</legend>
              <div className="flex flex-wrap gap-2">
                {STOP_REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    aria-pressed={reason === r.value}
                    onClick={() => setReason(reason === r.value ? null : r.value)}
                    className={`h-10 rounded-full px-4 text-sm font-medium ${
                      reason === r.value ? "bg-primary text-on-primary" : "border border-border-strong hover:bg-surface-muted"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {error && <Alert kind="error">{error}</Alert>}
          <button type="button" disabled={pending} onClick={submit} className={buttonClass("primary")}>
            {pending ? "Mentés…" : "Abbahagyás"}
          </button>
        </div>
      </Sheet>
    </>
  );
}
