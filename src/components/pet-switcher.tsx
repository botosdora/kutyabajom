"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { selectPet } from "@/app/(app)/actions";

type PetOption = { id: string; name: string };

export function PetAvatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.44 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-link"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function PetSwitcher({ pets, currentId }: { pets: PetOption[]; currentId: string | null }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const current = pets.find((p) => p.id === currentId);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!current) {
    return (
      <Link href="/kutyak/uj" className="text-[15px] font-semibold text-link">
        + Kutya hozzáadása
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Kiválasztott kutya: ${current.name}. Váltás`}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 items-center gap-2 rounded-full border border-border-strong bg-surface pl-1 pr-3 ${
          pending ? "opacity-60" : ""
        }`}
      >
        <PetAvatar name={current.name} />
        <span className="text-[15px] font-semibold">{current.name}</span>
        <ChevronDown size={16} className="text-text-muted" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-12 z-30 min-w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-lg"
        >
          {pets.map((p) => (
            <button
              key={p.id}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                startTransition(() => selectPet(p.id));
              }}
              className="flex h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-[15px] hover:bg-surface-muted"
            >
              <PetAvatar name={p.name} size={28} />
              <span className="flex-1">{p.name}</span>
              {p.id === currentId && <Check size={16} className="text-link" aria-hidden="true" />}
            </button>
          ))}
          <Link
            role="menuitem"
            href="/kutyak/uj"
            onClick={() => setOpen(false)}
            className="flex h-11 items-center gap-2 rounded-xl px-2 text-[15px] font-medium text-link hover:bg-surface-muted"
          >
            <Plus size={18} aria-hidden="true" className="mx-[5px]" />
            Új kutya
          </Link>
        </div>
      )}
    </div>
  );
}
