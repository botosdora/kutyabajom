import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { login } from "../actions";

export const metadata = { title: "Belépés" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Belépés</h1>
      <ActionForm action={login}>
        <Field label="E-mail cím" name="email" type="email" autoComplete="email" required />
        <Field label="Jelszó" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton pendingText="Egy pillanat…">Belépés</SubmitButton>
      </ActionForm>
      <div className="mt-6 flex flex-col gap-2 text-center text-sm">
        <Link href="/elfelejtett-jelszo" className="text-primary hover:text-primary-hover">
          Elfelejtetted a jelszavad?
        </Link>
        <p className="text-text-muted">
          Még nincs fiókod?{" "}
          <Link href="/regisztracio" className="font-semibold text-primary hover:text-primary-hover">
            Regisztráció
          </Link>
        </p>
      </div>
    </>
  );
}
