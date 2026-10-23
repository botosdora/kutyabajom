import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { PetAvatar } from "@/components/pet-switcher";
import { buttonClass, Card, Field, PageHeader, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getPets, requireUser } from "@/lib/pets";
import { updateProfile } from "../actions";
import { logout } from "../../(auth)/actions";

export const metadata = { title: "Több" };

export default async function MorePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, pets] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getPets(),
  ]);

  return (
    <>
      <PageHeader title="Több" />

      <section className="mb-6">
        <SectionTitle action={<Link href="/kutyak/uj" className="text-sm font-semibold text-primary">+ Új kutya</Link>}>
          Kutyáim
        </SectionTitle>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {pets.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <PetAvatar name={p.name} />
              <span className="flex-1 font-medium">{p.name}</span>
              <span className="text-sm text-text-muted">{p.breed}</span>
            </li>
          ))}
        </ul>
        <Link href="/kutya" className="mt-2 inline-block text-sm font-medium text-primary">
          A kiválasztott kutya adatai és gazdái →
        </Link>
      </section>

      <section className="mb-6">
        <SectionTitle>Gazdi profil</SectionTitle>
        <Card>
          <ActionForm action={updateProfile}>
            <Field label="Név" name="full_name" defaultValue={profile?.full_name ?? ""} autoComplete="name" />
            <Field label="E-mail cím" name="email" defaultValue={user.email} disabled />
            <Field label="Telefonszám" name="phone" type="tel" defaultValue={profile?.phone ?? ""} autoComplete="tel" />
            <label className="flex items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                name="notifications_enabled"
                defaultChecked={profile?.notifications_enabled ?? true}
                className="size-5 accent-primary"
              />
              Értesítéseket kérek
            </label>
            <SubmitButton>Mentés</SubmitButton>
          </ActionForm>
        </Card>
      </section>

      <form action={logout}>
        <button type="submit" className={buttonClass("secondary", "w-full")}>
          Kijelentkezés
        </button>
      </form>
    </>
  );
}
