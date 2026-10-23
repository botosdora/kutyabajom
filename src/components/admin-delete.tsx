"use client";

import { useState } from "react";
import { ActionForm, SubmitButton, type FormAction } from "@/components/forms";
import { buttonClass, Field } from "@/components/ui";

// Végleges törlés: külön lenyíló panel, megerősítésként be kell írni az e-mail címet.
export function AdminDeleteUser({ action, userId, email }: { action: FormAction; userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("danger", "h-9 px-3 text-sm")}>
        Törlés…
      </button>
    );
  }
  return (
    <div className="mt-3 w-full rounded-xl bg-danger-soft p-3">
      <ActionForm action={action}>
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="email" value={email} />
        <p className="text-sm text-danger">
          A fiók véglegesen törlődik. Azok a kutyák, amelyeknek ő az egyetlen gazdája, minden adatukkal és
          fájljukkal együtt törlődnek; a közös kutyák a többi gazdánál maradnak. Ez nem vonható vissza.
        </p>
        <Field label={`Megerősítés: írd be, hogy ${email}`} name="confirm" autoComplete="off" required />
        <div className="flex gap-2">
          <SubmitButton variant="danger" pendingText="Törlés…">
            Végleges törlés
          </SubmitButton>
          <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost")}>
            Mégse
          </button>
        </div>
      </ActionForm>
    </div>
  );
}
