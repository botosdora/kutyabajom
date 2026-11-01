import { Tags } from "lucide-react";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/forms";
import { SheetLauncher } from "@/components/sheet";
import { EmptyState, Field, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentPet } from "@/lib/pets";
import { deleteTaskType, renameTaskType } from "../actions";

export const metadata = { title: "Feladattípusok" };

export default async function TaskTypesPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const { data } = await supabase.from("task_types").select("id, name, calendar_events(count)").eq("pet_id", pet.id).order("name");
  const types = data ?? [];

  return (
    <>
      <PageHeader title="Feladattípusok" subtitle={pet.name} back={{ href: "/naptar", label: "Naptár" }} icon={Tags} />
      <p className="mb-4 text-sm text-text-muted">
        Új típust feladat felvételekor adhatsz hozzá. Ha törölsz egy típust, a hozzá tartozó feladatok megmaradnak, csak típus nélkül.
      </p>
      {types.length ? (
        <ul className="flex flex-col gap-2">
          {types.map((t) => {
            const count = t.calendar_events[0]?.count ?? 0;
            return (
              <li key={t.id} className="flex items-center gap-2 rounded-2xl border border-border bg-surface py-2 pl-4 pr-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{t.name}</span>
                  <span className="block text-sm text-text-muted">{count ? `${count} feladat` : "Még nincs feladat"}</span>
                </span>
                <SheetLauncher title={`${t.name} átnevezése`}>
                  <ActionForm action={renameTaskType}>
                    <input type="hidden" name="id" value={t.id} />
                    <Field label="Név" name="name" defaultValue={t.name} required autoFocus />
                    <SubmitButton>Mentés</SubmitButton>
                  </ActionForm>
                </SheetLauncher>
                <DeleteButton
                  action={deleteTaskType.bind(null, t.id)}
                  confirmText={
                    count
                      ? `Törlöd a(z) „${t.name}” típust? ${count} feladat megmarad, de típus nélkül.`
                      : `Törlöd a(z) „${t.name}” típust?`
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>Még nincs saját feladattípus.</EmptyState>
      )}
    </>
  );
}
