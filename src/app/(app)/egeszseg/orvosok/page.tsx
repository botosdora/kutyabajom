import { Mail, MapPin, Phone } from "lucide-react";
import { AddPanel, DeleteButton } from "@/components/forms";
import { EmptyState, Field, PageHeader, TextArea } from "@/components/ui";
import { getVets } from "@/lib/health";
import { requireCurrentPet } from "@/lib/pets";
import { addVet, deleteRecord } from "../actions";

export const metadata = { title: "Orvosok" };

export default async function VetsPage() {
  const pet = await requireCurrentPet();
  const vets = await getVets(pet.id);

  return (
    <>
      <PageHeader title="Orvosok" subtitle={pet.name} back={{ href: "/egeszseg", label: "Egészség" }} />

      <div className="mb-6">
        <AddPanel label="Új orvos" action={addVet}>
          <input type="hidden" name="pet_id" value={pet.id} />
          <Field label="Név" name="name" placeholder="pl. Dr. Kovács Anna" required />
          <Field label="Rendelő / klinika" name="clinic" />
          <Field label="Szakterület" name="specialty" placeholder="pl. ortopédia" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon" name="phone" type="tel" />
            <Field label="E-mail" name="email" type="email" />
          </div>
          <Field label="Cím" name="address" />
          <TextArea label="Megjegyzés" name="notes" placeholder="pl. rendelési idő" />
        </AddPanel>
      </div>

      {vets.length === 0 ? (
        <EmptyState>Még nincs rögzített orvos.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {vets.map((v) => (
            <li key={v.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-start gap-2">
                <div className="flex-1">
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-sm text-text-muted">{[v.clinic, v.specialty].filter(Boolean).join(" · ")}</p>
                </div>
                <DeleteButton action={deleteRecord.bind(null, "vets", v.id, "/egeszseg/orvosok")} />
              </div>
              <div className="flex flex-col gap-1 text-sm">
                {v.phone && (
                  <a href={`tel:${v.phone}`} className="flex items-center gap-2 text-link">
                    <Phone size={16} aria-hidden="true" /> {v.phone}
                  </a>
                )}
                {v.email && (
                  <a href={`mailto:${v.email}`} className="flex items-center gap-2 text-link">
                    <Mail size={16} aria-hidden="true" /> {v.email}
                  </a>
                )}
                {v.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(v.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-link"
                  >
                    <MapPin size={16} aria-hidden="true" /> {v.address}
                  </a>
                )}
                {v.notes && <p className="mt-1 text-text-muted">{v.notes}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
