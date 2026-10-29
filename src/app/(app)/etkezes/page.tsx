import Link from "next/link";
import { Bone, ChevronRight, CircleStop, Clock, ThumbsDown, Utensils } from "lucide-react";
import { ActionForm, AddPanel, SubmitButton } from "@/components/forms";
import { FoodFields } from "@/components/food-fields";
import { Card, EmptyState, Field, GroupCard, PageHeader, SectionTitle, Tabs, TextArea } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, inDaysLabel, todayIso } from "@/lib/format";
import { FOOD_KINDS, foodKindLabel } from "@/lib/foods";
import { requireCurrentPet } from "@/lib/pets";
import { updateMealTimes } from "../actions";
import { addFood } from "./actions";
import type { Tables } from "@/lib/database.types";

export const metadata = { title: "Étkezés" };

// Korábbi étel: jól látható címkével, hogy nem vált be, vagy csak már nem kapja.
function PastFoodCard({ food }: { food: Tables<"foods"> }) {
  const failed = food.status === "failed";
  const Icon = food.kind === "tap" ? Utensils : Bone;
  return (
    <li>
      <Link href={`/etkezes/${food.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface py-3 pl-3 pr-4 hover:bg-surface-muted">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-muted">
          <Icon size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{food.name}</span>
          <span className="block truncate text-sm text-text-muted">{[foodKindLabel(food.kind), food.food_type].filter(Boolean).join(" · ")}</span>
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              failed ? "bg-danger-soft text-danger" : "bg-surface-muted text-text-muted"
            }`}
          >
            {failed ? <ThumbsDown size={12} aria-hidden="true" /> : <CircleStop size={12} aria-hidden="true" />}
            {failed ? "Nem vált be" : "Már nem kapja"}
          </span>
          {failed && food.fail_reason && <span className="mt-1 block text-sm">{food.fail_reason}</span>}
        </span>
        <ChevronRight size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

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

export default async function FeedingPage({ searchParams }: { searchParams: Promise<{ lap?: string }> }) {
  const pet = await requireCurrentPet();
  const showPast = (await searchParams).lap === "korabbi";
  const supabase = await createClient();
  const { data } = await supabase.from("foods").select("*").eq("pet_id", pet.id).order("name");
  const foods = data ?? [];
  const today = todayIso();
  const active = foods.filter((f) => f.status === "active");
  const failed = foods.filter((f) => f.status === "failed");
  const past = foods.filter((f) => f.status === "past");

  return (
    <>
      <PageHeader title="Étkezés" subtitle={pet.name} icon={Utensils} />

      <Tabs
        items={[
          { href: "/etkezes", label: "Adjuk", count: active.length, active: !showPast },
          { href: "/etkezes?lap=korabbi", label: "Korábbi", count: failed.length + past.length, active: showPast },
        ]}
      />

      {showPast ? (
        <>
          <p className="mb-3 text-sm text-text-muted">Amit korábban kapott – a nem bevált tápokat érdemes megjegyezni, hogy legközelebb ne vegyétek meg újra.</p>
          {failed.length + past.length > 0 ? (
            <ul className="mb-4 flex flex-col gap-2">
              {[...failed, ...past].map((f) => (
                <PastFoodCard key={f.id} food={f} />
              ))}
            </ul>
          ) : (
            <div className="mb-4">
              <EmptyState>Még nincs korábbi vagy nem bevált táp.</EmptyState>
            </div>
          )}
          <AddPanel label="Nem bevált táp rögzítése" action={addFood}>
            <input type="hidden" name="pet_id" value={pet.id} />
            <input type="hidden" name="status" value="failed" />
            <FoodFields />
            <TextArea label="Miért nem vált be?" name="fail_reason" placeholder="pl. hasmenést okozott, nem ette meg" />
          </AddPanel>
        </>
      ) : (
        <>
          {FOOD_KINDS.map((k) => {
            const list = active.filter((f) => f.kind === k.value);
            return (
              <GroupCard
                key={k.value}
                title={k.value === "tap" ? "Jelenlegi tápok" : "Jutalomfalatok"}
                icon={k.value === "tap" ? Utensils : Bone}
                count={list.length}
              >
                {list.length ? (
                  <ul className="flex flex-col gap-2">
                    {list.map((f) => (
                      <FoodRow key={f.id} food={f} today={today} />
                    ))}
                  </ul>
                ) : (
                  <p className="px-2 py-3 text-center text-sm text-text-muted">Nincs rögzítve.</p>
                )}
              </GroupCard>
            );
          })}

          <div className="mb-8">
            <AddPanel label="Új táp vagy jutalomfalat" action={addFood}>
              <input type="hidden" name="pet_id" value={pet.id} />
              <FoodFields />
            </AddPanel>
          </div>

          <FeedingTimes pet={pet} />
        </>
      )}
    </>
  );
}

function FeedingTimes({ pet }: { pet: Tables<"pets"> }) {
  return (
    <section>
      <SectionTitle icon={Clock}>Etetési időpontok</SectionTitle>
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
  );
}
