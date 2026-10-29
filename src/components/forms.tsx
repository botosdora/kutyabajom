"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { Alert, buttonClass, type ButtonVariant } from "@/components/ui";
import { useToast } from "@/components/toast";
import { SheetLauncher, useSheetClose } from "@/components/sheet";

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

// Űrlap: a hibát dobozban mutatja, a sikeres mentést felugró üzenettel jelzi.
// `persistentMessage` esetén a visszajelzés az űrlapon marad (pl. "Küldtünk egy e-mailt").
export function ActionForm({
  action,
  children,
  className = "flex flex-col gap-4",
  onSuccess,
  persistentMessage = false,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  onSuccess?: () => void;
  persistentMessage?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  const handled = useRef<ActionResult>(null);
  const toast = useToast();
  // Panelben lévő űrlap sikeres mentés után bezárja a panelt.
  const closeSheet = useSheetClose();

  useEffect(() => {
    if (state && !state.error && handled.current !== state) {
      handled.current = state;
      if (state.message && !persistentMessage) toast(state.message);
      onSuccess?.();
      closeSheet?.();
    }
  }, [state, onSuccess, toast, persistentMessage, closeSheet]);

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {persistentMessage && state?.message && <Alert kind="success">{state.message}</Alert>}
    </form>
  );
}

// "+ Új hozzáadása" gomb; az űrlap alulról felcsúszó panelben nyílik.
export function AddPanel({
  label,
  action,
  children,
  defaultOpen = false,
}: {
  label: string;
  action: FormAction;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <SheetLauncher title={label} label={`+ ${label}`} className="w-full" defaultOpen={defaultOpen}>
      <ActionForm action={action}>
        {children}
        <SubmitButton>Mentés</SubmitButton>
      </ActionForm>
    </SheetLauncher>
  );
}

// Törlés gomb megerősítéssel. Felirat nélkül csak egy kuka ikon (listákhoz).
export function DeleteButton({
  action,
  label,
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
      {label ? (
        <button type="submit" className={buttonClass("danger", "h-9 px-3 text-sm")}>
          {label}
        </button>
      ) : (
        <button
          type="submit"
          aria-label="Törlés"
          title="Törlés"
          className="flex size-10 items-center justify-center rounded-xl bg-surface-muted text-text-muted hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
