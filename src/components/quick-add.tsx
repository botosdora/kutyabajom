"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, ClipboardList, FileUp, NotebookPen, Pill, Plus, Scale, Wallet, X } from "lucide-react";
import { ActionForm, SubmitButton, type FormAction } from "@/components/forms";
import { buttonClass, Field } from "@/components/ui";

const LINKS = [
  { href: "/egeszseg/suly?uj=1", label: "Súlymérés", icon: Scale },
  { href: "/naplo", label: "Napló", icon: NotebookPen },
  { href: "/naptar/uj", label: "Esemény", icon: CalendarPlus },
  { href: "/koltsegek?uj=1", label: "Kiadás", icon: Wallet },
  { href: "/egeszseg/dokumentumok?uj=1", label: "Dokumentum", icon: FileUp },
  { href: "/gyogyszerek/uj", label: "Gyógyszer", icon: Pill },
];

// Egyetlen "+ Hozzáadás" gomb a teendők alatt; kinyitva választható, mit rögzítünk.
export function QuickAdd({ action, petId }: { action: FormAction; petId: string }) {
  const [mode, setMode] = useState<"closed" | "menu" | "task">("closed");

  if (mode === "closed") {
    return (
      <button type="button" onClick={() => setMode("menu")} className={buttonClass("secondary", "w-full")}>
        <Plus size={18} aria-hidden="true" /> Hozzáadás
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="px-1 text-sm font-semibold">{mode === "task" ? "Saját teendő mára" : "Mit szeretnél hozzáadni?"}</p>
        <button
          type="button"
          aria-label="Bezárás"
          onClick={() => setMode("closed")}
          className="flex size-9 items-center justify-center rounded-lg bg-surface text-text-muted"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {mode === "menu" ? (
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setMode("task")}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-surface px-1 py-2.5 text-center text-[11px] font-semibold leading-tight hover:bg-primary-soft sm:text-xs"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-link">
              <ClipboardList size={20} aria-hidden="true" />
            </span>
            Saját teendő
          </button>
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-surface px-1 py-2.5 text-center text-[11px] font-semibold leading-tight hover:bg-primary-soft sm:text-xs"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-link">
                <Icon size={20} aria-hidden="true" />
              </span>
              {label}
            </Link>
          ))}
        </div>
      ) : (
        <ActionForm action={action} onSuccess={() => setMode("closed")}>
          <input type="hidden" name="pet_id" value={petId} />
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Teendő" name="title" placeholder="pl. fülcsepp, karomvágás" required />
            <Field label="Időpont" name="event_time" type="time" />
          </div>
          <p className="text-xs text-text-muted">A naptárba is bekerül feladatként.</p>
          <div className="flex gap-2">
            <SubmitButton className="flex-1">Mentés</SubmitButton>
            <button type="button" onClick={() => setMode("menu")} className={buttonClass("ghost")}>
              Vissza
            </button>
          </div>
        </ActionForm>
      )}
    </div>
  );
}
