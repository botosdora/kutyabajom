import Link from "next/link";
import { Bell, ChevronRight, Dog, Download, HardDrive, LayoutGrid, ShieldCheck, Palette, Pill, UserRound, Utensils, Wallet } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { PetAvatar } from "@/components/pet-switcher";
import { buttonClass, Card, Field, PageHeader, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getPets, petPhotoUrl, requireUser } from "@/lib/pets";
import { ACCENT_COOKIE, ACCENTS, parseAccent, parseTheme, THEME_COOKIE, THEMES } from "@/lib/appearance";
import { cookies } from "next/headers";
import { setAppearance, updateNotificationSettings, updateProfile } from "../actions";
import { PushSettings } from "@/components/push-settings";
import { logout } from "../../(auth)/actions";

export const metadata = { title: "Egyéb" };

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
      <PageHeader title="Egyéb" icon={LayoutGrid} />

      <ul className="mb-6 divide-y divide-border rounded-2xl border border-border bg-surface">
        {[...MENU, ...(profile?.is_admin ? [{ href: "/admin", label: "Adminisztráció", icon: ShieldCheck }] : [])].map(({ href, label, icon: Icon }) => (
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
        <SectionTitle icon={Dog} action={<Link href="/kutyak/uj" className="text-sm font-semibold text-link">+ Új kutya</Link>}>
          Kutyáim
        </SectionTitle>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {pets.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <PetAvatar name={p.name} photoUrl={petPhotoUrl(p.photo_path)} />
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
        <SectionTitle icon={Palette}>Megjelenés</SectionTitle>
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
        <SectionTitle icon={Bell}>Értesítések</SectionTitle>
        <Card className="flex flex-col gap-4">
          <PushSettings />
          <ActionForm action={updateNotificationSettings} className="flex flex-col gap-3 border-t border-border pt-4">
            {[
              { name: "notifications_enabled", label: "Értesítéseket kérek", hint: "Főkapcsoló minden eszközödre.", checked: profile?.notifications_enabled },
              { name: "notify_doses", label: "Gyógyszerek az időpontjukban", hint: "Ha addig nem pipáltad ki.", checked: profile?.notify_doses },
              {
                name: "notify_reminders",
                label: "Emlékeztetők",
                hint: "Vizsgálat 5, feladat 1, újravásárlás 7 nappal előre, lejáró oltás, és az esemény napján „Megtörtént?”.",
                checked: profile?.notify_reminders,
              },
            ].map((o) => (
              <label key={o.name} className="flex items-start gap-3">
                <input type="checkbox" name={o.name} defaultChecked={o.checked ?? true} className="mt-0.5 size-5 shrink-0 accent-primary" />
                <span>
                  <span className="block text-[15px] font-medium">{o.label}</span>
                  <span className="block text-xs text-text-muted">{o.hint}</span>
                </span>
              </label>
            ))}
            <Field
              label="Emlékeztetők időpontja"
              name="daily_reminder_time"
              type="time"
              defaultValue={profile?.daily_reminder_time?.slice(0, 5) ?? "08:00"}
              hint="Az előre szóló emlékeztetők naponta ekkor érkeznek."
            />
            <SubmitButton>Mentés</SubmitButton>
          </ActionForm>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle icon={UserRound}>Gazdi profil</SectionTitle>
        <Card>
          <ActionForm action={updateProfile}>
            <Field label="Név" name="full_name" defaultValue={profile?.full_name ?? ""} autoComplete="name" />
            <Field label="E-mail cím" name="email" defaultValue={user.email} disabled />
            <Field label="Telefonszám" name="phone" type="tel" defaultValue={profile?.phone ?? ""} autoComplete="tel" />
            <SubmitButton>Mentés</SubmitButton>
          </ActionForm>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle icon={HardDrive}>Adatmentés</SectionTitle>
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-text-muted">
              Töltsd le időnként az adataidat. A mentés minden kutyád minden adatát tartalmazza.
            </p>
            <div className="flex flex-wrap gap-2">
              <a href="/export/mentes" className={buttonClass("secondary")}>
                <Download size={18} aria-hidden="true" /> Adatok mentése
              </a>
              <a href="/export/mentes?fajlokkal=1" className={buttonClass("ghost")}>
                <Download size={18} aria-hidden="true" /> Dokumentumokkal együtt
              </a>
            </div>
          </div>
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
