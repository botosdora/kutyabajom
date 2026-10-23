import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { requestPasswordReset } from "../actions";

export const metadata = { title: "Elfelejtett jelszó" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Elfelejtett jelszó</h1>
      <p className="mb-6 text-sm text-text-muted">Küldünk egy linket, amellyel új jelszót adhatsz meg.</p>
      <ActionForm action={requestPasswordReset}>
        <Field label="E-mail cím" name="email" type="email" autoComplete="email" required />
        <SubmitButton pendingText="Egy pillanat…">Link küldése</SubmitButton>
      </ActionForm>
      <Link href="/belepes" className="mt-6 text-center text-sm text-primary hover:text-primary-hover">
        Vissza a belépéshez
      </Link>
    </>
  );
}
