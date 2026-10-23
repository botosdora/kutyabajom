import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ActionForm, AddPanel, SubmitButton } from "@/components/forms";
import { FoodFields } from "@/components/food-fields";
import { Card, EmptyState, Field, PageHeader, SectionTitle, TextArea } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, inDaysLabel, todayIso } from "@/lib/format";
import { FOOD_KINDS, foodKindLabel } from "@/lib/foods";
import { requireCurrentPet } from "@/lib/pets";
import { updateMealTimes } from "../actions";
import { addFood } from "./actions";
import type { Tables } from "@/lib/database.types";

export const metadata = { title: "Étkezés" };

function FoodRow({ food, today }: { food: Tables<"foods">; today: string }) {
  const days = food.reorder_on ? daysBetween(today, food.reorder_on) : null;
  return (
    <li>
      <Link href={`/etkezes/${food.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-muted">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{food.name}</span>
          <span className="block truncate text-sm text-text-muted">
            {[food.food_type, food.daily_grams != null && `${Number(food.daily_grams).toLocaleString("hu-HU")} g/nap`].filter(Boolean).join(" · ") ||
              foodKindLabel(food.kind)}
          </span>
          {food.status === "failed" && food.fail_reason && <span className="block text-sm text-danger">{food.fail_reason}</span>}
          {food.status === "active" && days !== null && days <= 7 && (
            <span className="block text-sm font-medium text-warn-text">Újrarendelés: {inDaysLabel(days)}</span>
          )}
        </span>
        <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

export default async function FeedingPage() {
  const pet = await requireCurrentPet();
  const supabase = await createClient();
  const { data } = await supabase.from("foods").select("*").eq("pet_id", pet.id).order("name");
  const foods = data ?? [];
  const today = todayIso();
  const active = foods.filter((f) => f.status === "active");
  const failed = foods.filter((f) => f.status === "failed");
  const past = foods.filter((f) => f.status === "past");

  return (
    <>
      <PageHeader title="Étkezés" subtitle={pet.name} />

      {FOOD_KINDS.map((k) => {
        const list = active.filter((f) => f.kind === k.value);
        return (
          <section key={k.value} className="mb-6">
            <SectionTitle>{k.value === "tap" ? "Jelenlegi tápok" : "Jutalomfalatok"}</SectionTitle>
            {list.length ? (
              <ul className="flex flex-col gap-2">
                {list.map((f) => (
                  <FoodRow key={f.id} food={f} today={today} />
                ))}
              </ul>
            ) : (
              <EmptyState>Nincs rögzítve.</EmptyState>
            )}
          </section>
        );
      })}

      <div className="mb-8">
        <AddPanel label="Új táp vagy jutalomfalat" action={addFood}>
          <input type="hidden" name="pet_id" value={pet.id} />
          <FoodFields />
        </AddPanel>
      </div>

      <section className="mb-6">
        <SectionTitle>Nem bevált tápok</SectionTitle>
        <p className="mb-2 text-sm text-text-muted">Amit korábban kipróbáltatok, de nem vált be – hogy legközelebb ne vegyétek meg újra.</p>
        {failed.length > 0 && (
          <ul className="mb-3 flex flex-col gap-2">
            {failed.map((f) => (
              <FoodRow key={f.id} food={f} today={today} />
            ))}
          </ul>
        )}
        <AddPanel label="Nem bevált táp rögzítése" action={addFood}>
          <input type="hidden" name="pet_id" value={pet.id} />
          <input type="hidden" name="status" value="failed" />
          <FoodFields />
          <TextArea label="Miért nem vált be?" name="fail_reason" placeholder="pl. hasmenést okozott, nem ette meg" />
        </AddPanel>
      </section>

      {past.length > 0 && (
        <details className="mb-6">
          <summary className="cursor-pointer text-sm font-semibold text-text-muted">Korábbi tápok ({past.length})</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {past.map((f) => (
              <FoodRow key={f.id} food={f} today={today} />
            ))}
          </ul>
        </details>
      )}

      <section>
        <SectionTitle>Etetési időpontok</SectionTitle>
        <Card>
          <ActionForm action={updateMealTimes}>
            <input type="hidden" name="pet_id" value={pet.id} />
            <p className="text-sm text-text-muted">A főoldalon ezekben az időpontokban jelenik meg a reggeli és a vacsora.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Reggeli" name="breakfast_time" type="time" defaultValue={pet.breakfast_time.slice(0, 5)} required />
              <Field label="Vacsora" name="dinner_time" type="time" defaultValue={pet.dinner_time.slice(0, 5)} required />
            </div>
            <SubmitButton>Mentés</SubmitButton>
          </ActionForm>
        </Card>
      </section>
    </>
  );
}
