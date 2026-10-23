import Link from "next/link";
import { ChevronRight, Pill, Utensils, Wallet } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { PetAvatar } from "@/components/pet-switcher";
import { buttonClass, Card, Field, PageHeader, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getPets, requireUser } from "@/lib/pets";
import { ACCENT_COOKIE, ACCENTS, parseAccent, parseTheme, THEME_COOKIE, THEMES } from "@/lib/appearance";
import { cookies } from "next/headers";
import { setAppearance, updateProfile } from "../actions";
import { logout } from "../../(auth)/actions";

export const metadata = { title: "Több" };

const MENU = [
  { href: "/gyogyszerek", label: "Gyógyszerek és kiegészítők", icon: Pill },
  { href: "/etkezes", label: "Étkezés", icon: Utensils },
  { href: "/koltsegek", label: "Költségek", icon: Wallet },
];

export default async function MorePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const store = await cookies();
  const theme = parseTheme(store.get(THEME_COOKIE)?.value);
  const accent = parseAccent(store.get(ACCENT_COOKIE)?.value);
  const [{ data: profile }, pets] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getPets(),
  ]);

  return (
    <>
      <PageHeader title="Több" />

      <ul className="mb-6 divide-y divide-border rounded-2xl border border-border bg-surface">
        {MENU.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted">
              <Icon size={20} className="text-link" aria-hidden="true" />
              <span className="flex-1 font-medium">{label}</span>
              <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <section className="mb-6">
        <SectionTitle action={<Link href="/kutyak/uj" className="text-sm font-semibold text-link">+ Új kutya</Link>}>
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
        <Link href="/kutya" className="mt-2 inline-block text-sm font-medium text-link">
          A kiválasztott kutya adatai és gazdái →
        </Link>
      </section>

      <section className="mb-6">
        <SectionTitle>Megjelenés</SectionTitle>
        <Card className="flex flex-col gap-4">
          <form action={setAppearance}>
            <p className="mb-1.5 text-sm font-medium">Téma</p>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="submit"
                  name="theme"
                  value={t.value}
                  aria-pressed={theme === t.value}
                  className={`h-10 rounded-lg text-sm font-semibold ${
                    theme === t.value ? "bg-surface text-link shadow-sm" : "text-text-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </form>
          <form action={setAppearance}>
            <p className="mb-1.5 text-sm font-medium">Szín</p>
            <div className="flex flex-wrap gap-3">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  type="submit"
                  name="accent"
                  value={a.value}
                  aria-pressed={accent === a.value}
                  aria-label={a.label}
                  title={a.label}
                  className={`flex size-11 items-center justify-center rounded-full ${
                    accent === a.value ? "ring-2 ring-text ring-offset-2 ring-offset-surface" : ""
                  }`}
                  style={{ background: a.swatch }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-text-muted">A megjelenés ezen az eszközön érvényes.</p>
          </form>
        </Card>
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
