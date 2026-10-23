import Link from "next/link";
import { ChevronRight, FileText, Pill, Scale, ShieldAlert, Stethoscope, Syringe, UserRound } from "lucide-react";
import { PetAvatar } from "@/components/pet-switcher";
import { Card, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentPet } from "@/lib/pets";
import { formatAge, formatWeight } from "@/lib/format";

export const metadata = { title: "Egészség" };

export default async function HealthPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const count = (table: "allergies" | "conditions" | "vaccinations" | "medical_events" | "vets" | "documents") =>
    supabase.from(table).select("id", { count: "exact", head: true }).eq("pet_id", pet.id);

  const [latestWeight, allergies, conditions, vaccinations, events, vets, docs] = await Promise.all([
    supabase
      .from("weights")
      .select("weight_kg")
      .eq("pet_id", pet.id)
      .order("measured_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    count("allergies"),
    count("conditions"),
    count("vaccinations"),
    count("medical_events"),
    count("vets"),
    count("documents"),
  ]);

  const facts = [
    { label: "Fajta", value: pet.breed },
    { label: "Kor", value: formatAge(pet.birth_date) },
    { label: "Nem", value: pet.sex === "kan" ? "Kan" : pet.sex === "szuka" ? "Szuka" : null },
    { label: "Súly", value: latestWeight.data ? formatWeight(Number(latestWeight.data.weight_kg)) : null },
    { label: "Chipszám", value: pet.chip_number },
  ];

  const sections = [
    { href: "/gyogyszerek", label: "Gyógyszerek és kiegészítők", icon: Pill, meta: "Ütemezés, vásárlások" },
    { href: "/egeszseg/suly", label: "Súly", icon: Scale, meta: "Mérések és diagram" },
    {
      href: "/egeszseg/allergiak",
      label: "Allergiák és betegségek",
      icon: ShieldAlert,
      meta: `${allergies.count ?? 0} allergia · ${conditions.count ?? 0} betegség`,
    },
    { href: "/egeszseg/oltasok", label: "Oltások", icon: Syringe, meta: `${vaccinations.count ?? 0} rögzítve` },
    {
      href: "/egeszseg/beavatkozasok",
      label: "Orvosi beavatkozások",
      icon: Stethoscope,
      meta: `${events.count ?? 0} esemény`,
    },
    { href: "/egeszseg/dokumentumok", label: "Orvosi dokumentumok", icon: FileText, meta: `${docs.count ?? 0} dokumentum` },
    { href: "/egeszseg/orvosok", label: "Orvosok", icon: UserRound, meta: `${vets.count ?? 0} orvos` },
  ];

  return (
    <>
      <PageHeader title="Egészség" />

      <Card className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <PetAvatar name={pet.name} size={48} />
          <div className="flex-1">
            <p className="text-lg font-bold">{pet.name}</p>
            <Link href="/kutya" className="text-sm font-medium text-link hover:opacity-80">
              Adatok szerkesztése
            </Link>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-semibold uppercase text-text-muted">{f.label}</dt>
              <dd className="font-medium">{f.value ?? "–"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <ul className="flex flex-col gap-2">
        {sections.map(({ href, label, icon: Icon, meta }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-muted"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-link">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{label}</span>
                <span className="block text-sm text-text-muted">{meta}</span>
              </span>
              <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
