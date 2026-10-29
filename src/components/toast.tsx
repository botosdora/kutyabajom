"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

type ToastAction = { label: string; onClick: () => void };
type Toast = { id: number; text: string; action?: ToastAction };
const ToastContext = createContext<(text: string, action?: ToastAction) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

// Alul felugró, magától eltűnő visszajelzés (pl. "Elmentve."). Gombbal
// (pl. "Visszavonás") tovább marad, hogy legyen idő rányomni.
export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (text: string, action?: ToastAction) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { id, text, action }]);
      setTimeout(() => remove(id), action ? 7000 : 3000);
    },
    [remove],
  );

  return (
    <ToastContext value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-fade-in flex items-center gap-2 rounded-xl bg-text px-4 py-3 text-sm font-medium text-bg shadow-lg"
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            {t.text}
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  remove(t.id);
                  t.action!.onClick();
                }}
                className="pointer-events-auto -my-1 ml-2 rounded-lg px-2 py-1 font-semibold underline underline-offset-2 hover:bg-bg/15"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
