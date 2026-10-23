"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import { Upload } from "lucide-react";
import { prepareUpload, saveDocument } from "@/app/(app)/egeszseg/dokumentumok/actions";
import { useToast } from "@/components/toast";
import { Alert, buttonClass, Field, Select } from "@/components/ui";
import { compressImage } from "@/lib/image";

type Option = { value: string; label: string };

// Feltöltés: a fájl közvetlenül a böngészőből megy a tárolóba (aláírt címmel),
// utána mentjük az adatait. Így a nagy fájlok sem terhelik a szervert.
export function DocumentUpload({
  petId,
  supabaseUrl,
  supabaseKey,
  docTypes,
  today,
  medicalEventId,
  events,
  defaultTags,
  defaultOpen = false,
}: {
  petId: string;
  supabaseUrl: string;
  supabaseKey: string;
  docTypes: Option[];
  today: string;
  medicalEventId?: string;
  events?: Option[];
  defaultTags?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "w-full")}>
        <Upload size={18} aria-hidden="true" /> Dokumentum feltöltése
      </button>
    );
  }

  const submit = (fd: FormData) =>
    startTransition(async () => {
      setError(null);
      const picked = fd.get("file");
      if (!(picked instanceof File) || picked.size === 0) return setError("Válassz ki egy fájlt.");
      setStage("Kép tömörítése…");
      const file = await compressImage(picked);
      if (file.size > 20 * 1024 * 1024) {
        setStage(null);
        return setError("A fájl legfeljebb 20 MB lehet.");
      }
      setStage("Feltöltés…");

      const prepared = await prepareUpload(petId, file.name);
      if ("error" in prepared) return setError(prepared.error ?? "Hiba történt.");
      const storage = createClient(supabaseUrl, supabaseKey).storage.from("documents");
      const { error: uploadError } = await storage.uploadToSignedUrl(prepared.path, prepared.token, file, {
        contentType: file.type || undefined,
      });
      if (uploadError) {
        setStage(null);
        return setError("A feltöltés nem sikerült. Próbáld újra.");
      }

      fd.delete("file");
      fd.set("storage_path", prepared.path);
      fd.set("file_name", file.name);
      fd.set("mime_type", file.type);
      fd.set("size_bytes", String(file.size));
      if (!fd.get("title")) fd.set("title", file.name.replace(/\.[^.]+$/, ""));
      const result = await saveDocument(null, fd);
      setStage(null);
      if (result?.error) return setError(result.error);
      toast(result?.message ?? "Elmentve.");
      formRef.current?.reset();
      setOpen(false);
    });

  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-4">
      <form ref={formRef} action={submit} className="flex flex-col gap-4">
        <input type="hidden" name="pet_id" value={petId} />
        {medicalEventId && <input type="hidden" name="medical_event_id" value={medicalEventId} />}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Fájl (kép vagy PDF)</span>
          <span className="text-xs text-text-muted">A fotókat feltöltés előtt automatikusan kisebbre tömörítjük.</span>
          <input
            type="file"
            name="file"
            accept="image/*,application/pdf"
            required
            className="text-sm file:mr-3 file:h-10 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:font-semibold file:text-on-primary"
          />
        </label>
        <Field label="Megnevezés" name="title" placeholder="Ha üres, a fájl neve lesz" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Típus" name="doc_type" options={docTypes} defaultValue="labor" />
          <Field label="Dátum" name="document_date" type="date" defaultValue={today} required />
        </div>
        {!medicalEventId && events && events.length > 1 && (
          <Select label="Melyik vizsgálathoz tartozik?" name="medical_event_id" options={events} />
        )}
        <Field
          label="Címkék"
          name="tags"
          defaultValue={defaultTags}
          placeholder="pl. vérkép, máj"
          hint="Vesszővel elválasztva."
        />
        {error && <Alert kind="error">{error}</Alert>}
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={buttonClass("primary", "flex-1")}>
            {pending ? (stage ?? "Feltöltés…") : "Feltöltés"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost")}>
            Mégse
          </button>
        </div>
      </form>
    </div>
  );
}
