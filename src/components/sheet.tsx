"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Alulról felcsúszó panel (mint az iPhone saját appjaiban). Bezárás: háttérre
// koppintás, X gomb, Esc, vagy a fogantyú lehúzása.
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const dragHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      startY.current = e.clientY;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (startY.current !== null) setDrag(Math.max(0, e.clientY - startY.current));
    },
    onPointerUp: () => {
      startY.current = null;
      if (drag > 80) onClose();
      setDrag(0);
    },
  };

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Bezárás"
        tabIndex={-1}
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/40"
      />
      <div
        className="animate-sheet-up relative max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-surface px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl md:max-w-md md:rounded-3xl md:pb-5"
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
      >
        <div {...dragHandlers} className="sticky top-0 z-10 -mx-4 touch-none bg-surface px-4 pb-2 pt-2.5">
          <span aria-hidden="true" className="mx-auto mb-2 block h-1.5 w-10 rounded-full bg-border-strong md:hidden" />
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 truncate text-base font-bold">{title}</h2>
            <button
              type="button"
              aria-label="Bezárás"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-muted hover:bg-border"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="pt-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
