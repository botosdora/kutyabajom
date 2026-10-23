import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { signup } from "../actions";

export const metadata = { title: "Regisztráció" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ kod?: string }> }) {
  const { kod } = await searchParams;
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Regisztráció</h1>
      <p className="mb-6 text-sm text-text-muted">
        A Kutyabajom zárt körű: regisztrálni meghívókóddal lehet, amit egy már regisztrált gazditól kapsz.
      </p>
      <ActionForm persistentMessage action={signup}>
        <Field
          label="Meghívókód"
          name="invite_code"
          defaultValue={kod ?? ""}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="pl. K7M2QW9X"
          required
        />
        <Field label="Neved" name="full_name" autoComplete="name" required />
        <Field label="E-mail cím" name="email" type="email" autoComplete="email" required />
        <Field
          label="Jelszó"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          hint="Legalább 8 karakter."
          required
        />
        <Field label="Jelszó újra" name="password2" type="password" autoComplete="new-password" required />
        <SubmitButton pendingText="Egy pillanat…">Regisztráció</SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-text-muted">
        Van már fiókod?{" "}
        <Link href="/belepes" className="font-semibold text-link hover:opacity-80">
          Belépés
        </Link>
      </p>
    </>
  );
}
