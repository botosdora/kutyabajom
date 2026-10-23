"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass, type ButtonVariant } from "@/components/ui";

export type ActionResult = { error?: string; message?: string } | null;
export type FormAction = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

export function SubmitButton({
  children,
  pendingText = "Mentés…",
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, className)}>
      {pending ? pendingText : children}
    </button>
  );
}

// Űrlap, amely kiírja a szerveroldali hibát vagy visszajelzést.
export function ActionForm({
  action,
  children,
  className = "flex flex-col gap-4",
  onSuccess,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, null);
  const handled = useRef<ActionResult>(null);

  useEffect(() => {
    if (state && !state.error && handled.current !== state) {
      handled.current = state;
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="text-sm font-medium text-success">
          {state.message}
        </p>
      )}
    </form>
  );
}

// Lenyitható "Új hozzáadása" panel egy űrlappal.
export function AddPanel({
  label,
  action,
  children,
}: {
  label: string;
  action: FormAction;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "w-full")}>
        + {label}
      </button>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-4">
      <ActionForm action={action} onSuccess={() => setOpen(false)}>
        {children}
        <div className="flex gap-2">
          <SubmitButton className="flex-1">Mentés</SubmitButton>
          <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost")}>
            Mégse
          </button>
        </div>
      </ActionForm>
    </div>
  );
}

// Törlés gomb megerősítéssel.
export function DeleteButton({
  action,
  label = "Törlés",
  confirmText = "Biztosan törlöd?",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <button type="submit" className={buttonClass("danger", "h-9 px-3 text-sm")}>
        {label}
      </button>
    </form>
  );
}
