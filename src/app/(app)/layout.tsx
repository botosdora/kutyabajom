import Link from "next/link";
import { Logo, LogoMark } from "@/components/logo";
import { BottomNav, SideNav } from "@/components/nav";
import { PetSwitcher } from "@/components/pet-switcher";
import { ServiceWorkerRegister } from "@/components/push-settings";
import { getCurrentPet, getPets, petPhotoUrl } from "@/lib/pets";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [pets, current] = await Promise.all([getPets(), getCurrentPet()]);
  const switcher = (
    <PetSwitcher pets={pets.map((p) => ({ id: p.id, name: p.name, photoUrl: petPhotoUrl(p.photo_path) }))} currentId={current?.id ?? null} />
  );

  return (
    <div className="md:flex">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-border px-4 py-5 md:flex">
        <Link href="/" aria-label="Kutyabajom főoldal" className="px-2">
          <Logo size={34} />
        </Link>
        {switcher}
        <SideNav />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur md:hidden">
          {switcher}
          <Link href="/" aria-label="Kutyabajom főoldal" className="flex size-10 items-center justify-center rounded-xl bg-primary text-on-primary">
            <LogoMark size={28} />
          </Link>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-5 md:px-8 md:pb-12 md:pt-8 [&>*:not(.wide)]:mx-auto [&>*:not(.wide)]:max-w-2xl">{children}</main>
      </div>
      <BottomNav />
      <ServiceWorkerRegister />
    </div>
  );
}
