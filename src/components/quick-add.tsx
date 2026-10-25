"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, ClipboardList, FileUp, NotebookPen, Pill, Plus, Scale, Wallet } from "lucide-react";
import { ActionForm, SubmitButton, type FormAction } from "@/components/forms";
import { Sheet } from "@/components/sheet";
import { buttonClass, Field } from "@/components/ui";

const LINKS = [
  { href: "/egeszseg/suly?uj=1", label: "Súlymérés", icon: Scale },
  { href: "/naplo", label: "Napló", icon: NotebookPen },
  { href: "/naptar/uj", label: "Esemény", icon: CalendarPlus },
  { href: "/koltsegek?uj=1", label: "Kiadás", icon: Wallet },
  { href: "/egeszseg/dokumentumok?uj=1", label: "Dokumentum", icon: FileUp },
  { href: "/gyogyszerek/uj", label: "Gyógyszer", icon: Pill },
];

// Egyetlen "+ Hozzáadás" gomb a teendők alatt; alulról felcsúszó panelben választható, mit rögzítünk.
export function QuickAdd({ action, petId }: { action: FormAction; petId: string }) {
  const [mode, setMode] = useState<"closed" | "menu" | "task">("closed");

  const close = () => setMode("closed");

  return (
    <>
      <button type="button" onClick={() => setMode("menu")} aria-haspopup="dialog" className={buttonClass("secondary", "w-full")}>
        <Plus size={18} aria-hidden="true" /> Hozzáadás
      </button>
      <Sheet open={mode !== "closed"} onClose={close} title={mode === "task" ? "Saját teendő mára" : "Mit szeretnél hozzáadni?"}>
        {mode === "menu" ? (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setMode("task")}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-muted px-1 py-3 text-center text-[11px] font-semibold leading-tight hover:bg-primary-soft sm:text-xs"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-link">
                <ClipboardList size={22} aria-hidden="true" />
              </span>
              Saját teendő
            </button>
            {LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-muted px-1 py-3 text-center text-[11px] font-semibold leading-tight hover:bg-primary-soft sm:text-xs"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-link">
                  <Icon size={22} aria-hidden="true" />
                </span>
                {label}
              </Link>
            ))}
          </div>
        ) : (
          <ActionForm action={action} onSuccess={close}>
            <input type="hidden" name="pet_id" value={petId} />
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Field label="Teendő" name="title" placeholder="pl. fülcsepp, karomvágás" required autoFocus />
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
      </Sheet>
    </>
  );
}
