import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { updatePassword } from "../actions";

export const metadata = { title: "Új jelszó" };

export default function NewPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Új jelszó megadása</h1>
      <ActionForm action={updatePassword}>
        <Field label="Új jelszó" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <Field label="Új jelszó újra" name="password2" type="password" autoComplete="new-password" required />
        <SubmitButton>Jelszó mentése</SubmitButton>
      </ActionForm>
    </>
  );
}
