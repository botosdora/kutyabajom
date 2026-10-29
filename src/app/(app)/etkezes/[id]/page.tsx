import { notFound } from "next/navigation";
import { ActionForm, AddPanel, DeleteButton, SubmitButton } from "@/components/forms";
import { FoodFields } from "@/components/food-fields";
import { CircleStop, ThumbsDown, Utensils } from "lucide-react";
import { SheetLauncher } from "@/components/sheet";
import { Card, Field, PageHeader, SectionTitle, TextArea } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatHuf, todayIso } from "@/lib/format";
import { foodKindLabel } from "@/lib/foods";
import { addFoodPurchase, deleteFood, deleteFoodPurchase, setFoodStatus, updateFood } from "../actions";

const STATUS_LABEL: Record<string, string> = { active: "Jelenleg adjuk", past: "Már nem adjuk", failed: "Nem vált be" };

export default async function FoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: food } = await supabase.from("foods").select("*").eq("id", id).maybeSingle();
  if (!food) notFound();
  const { data: purchases } = await supabase
    .from("food_purchases")
    .select("*")
    .eq("food_id", id)
    .order("purchased_on", { ascending: false });
  const total = (purchases ?? []).reduce((s, p) => s + (p.cost_huf ?? 0), 0);

  return (
    <>
      <PageHeader
        title={food.name}
        subtitle={`${foodKindLabel(food.kind)} · ${STATUS_LABEL[food.status]}`}
        back={{ href: "/etkezes", label: "Étkezés" }}
        icon={Utensils}
        action={
          <SheetLauncher title={`${food.name} szerkesztése`}>
            <ActionForm action={updateFood}>
              <input type="hidden" name="id" value={food.id} />
              <FoodFields food={food} />
              {food.status === "failed" && <TextArea label="Miért nem vált be?" name="fail_reason" defaultValue={food.fail_reason ?? ""} />}
              <SubmitButton>Mentés</SubmitButton>
            </ActionForm>
            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <DeleteButton action={deleteFood.bind(null, food.id)} label="Törlés" confirmText="Biztosan törlöd? A vásárlásai is törlődnek." />
            </div>
          </SheetLauncher>
        }
      />

      <Card className="mb-6 flex flex-col gap-2 text-[15px]">
        {food.food_type && <p><span className="font-semibold">Típus:</span> {food.food_type}</p>}
        {food.daily_grams != null && <p><span className="font-semibold">Napi adag:</span> {Number(food.daily_grams).toLocaleString("hu-HU")} g</p>}
        <p><span className="font-semibold">Újrarendelés:</span> {formatDate(food.reorder_on)}</p>
        {food.fail_reason && <p className="text-danger"><span className="font-semibold">Miért nem vált be:</span> {food.fail_reason}</p>}
        {food.notes && <p className="whitespace-pre-line text-text-muted">{food.notes}</p>}
      </Card>

      <div className="mb-6 flex flex-wrap gap-2">
        {food.status === "active" ? (
          <>
            <ActionForm action={setFoodStatus} className="">
              <input type="hidden" name="id" value={food.id} />
              <input type="hidden" name="status" value="past" />
              <SubmitButton variant="secondary">
                <CircleStop size={18} aria-hidden="true" /> Már nem adjuk
              </SubmitButton>
            </ActionForm>
            <SheetLauncher title="Nem vált be" label="Nem vált be" icon={<ThumbsDown size={18} aria-hidden="true" />}>
              <ActionForm action={setFoodStatus}>
                <input type="hidden" name="id" value={food.id} />
                <input type="hidden" name="status" value="failed" />
                <TextArea label="Miért nem vált be?" name="fail_reason" placeholder="pl. viszketést okozott, nem ette meg" />
                <SubmitButton>Mentés</SubmitButton>
              </ActionForm>
            </SheetLauncher>
          </>
        ) : (
          <ActionForm action={setFoodStatus} className="">
            <input type="hidden" name="id" value={food.id} />
            <input type="hidden" name="status" value="active" />
            <SubmitButton>Újra adjuk</SubmitButton>
          </ActionForm>
        )}
      </div>

      <section className="mb-6">
        <SectionTitle action={total > 0 && <span className="text-sm text-text-muted">Összesen: {formatHuf(total)}</span>}>Vásárlások</SectionTitle>
        {!!purchases?.length && (
          <ul className="mb-3 divide-y divide-border rounded-2xl border border-border bg-surface">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2 pl-4 pr-2">
                <div className="flex-1">
                  <p className="font-semibold">
                    {formatDate(p.purchased_on)}
                    {p.cost_huf !== null && <span className="font-normal"> · {formatHuf(p.cost_huf)}</span>}
                  </p>
                  {p.quantity && <p className="text-sm text-text-muted">{p.quantity}</p>}
                </div>
                <DeleteButton action={deleteFoodPurchase.bind(null, p.id)} />
              </li>
            ))}
          </ul>
        )}
        <AddPanel label="Vásárlás rögzítése" action={addFoodPurchase}>
          <input type="hidden" name="food_id" value={food.id} />
          <input type="hidden" name="pet_id" value={food.pet_id} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dátum" name="purchased_on" type="date" defaultValue={todayIso()} required />
            <Field label="Ár (Ft)" name="cost_huf" type="number" min={0} inputMode="numeric" />
          </div>
          <Field label="Mennyiség" name="quantity" placeholder="pl. 12 kg" />
          <Field label="Következő újrarendelés" name="reorder_on" type="date" hint="Ha megadod, frissül az emlékeztető." />
        </AddPanel>
      </section>

    </>
  );
}
