"use client";

import { useState } from "react";
import { AddPanel, type FormAction } from "@/components/forms";
import { Field, Select, TextArea } from "@/components/ui";

type Option = { value: string; label: string };

export function ExpenseForm({
  action,
  petId,
  categories,
  medications,
  foods,
  medicalEvents,
  today,
}: {
  action: FormAction;
  petId: string;
  categories: Option[];
  medications: Option[];
  foods: Option[];
  medicalEvents: Option[];
  today: string;
}) {
  const [category, setCategory] = useState("allatorvos");
  const [medicationId, setMedicationId] = useState("");
  const [foodId, setFoodId] = useState("");
  const isMedPurchase = (category === "gyogyszer" && medicationId !== "") || (category === "etel" && foodId !== "");

  return (
    <AddPanel label="Új kiadás" action={action}>
      <input type="hidden" name="pet_id" value={petId} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Kategória" name="category" value={category} onChange={(e) => setCategory(e.target.value)} options={categories} />
        <Field label="Összeg (Ft)" name="amount_huf" type="number" min={0} inputMode="numeric" required />
      </div>
      <Field label="Dátum" name="spent_on" type="date" defaultValue={today} required />

      {category === "gyogyszer" && medications.length > 0 && (
        <Select
          label="Melyik gyógyszer?"
          name="medication_id"
          value={medicationId}
          onChange={(e) => setMedicationId(e.target.value)}
          options={[{ value: "", label: "– egyik sem –" }, ...medications]}
        />
      )}
      {category === "etel" && foods.length > 0 && (
        <Select
          label="Melyik táp vagy jutalomfalat?"
          name="food_id"
          value={foodId}
          onChange={(e) => setFoodId(e.target.value)}
          options={[{ value: "", label: "– egyik sem –" }, ...foods]}
        />
      )}
      {category === "allatorvos" && (
        <Select
          label="Melyik orvosi eseményhez tartozik?"
          name="medical_event_id"
          options={[
            { value: "", label: "– egyikhez sem –" },
            { value: "__new", label: "+ Új orvosi esemény ezzel a névvel" },
            ...medicalEvents,
          ]}
        />
      )}

      <Field
        label={isMedPurchase ? "Mennyiség" : "Megnevezés"}
        name="title"
        placeholder={isMedPurchase ? "pl. 3 db tabletta" : "pl. Kontroll vizsgálat, póráz"}
        required={!isMedPurchase}
      />
      <TextArea label="Megjegyzés" name="notes" />
    </AddPanel>
  );
}
