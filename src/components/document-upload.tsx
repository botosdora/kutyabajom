"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import { FileText, RefreshCw, Upload, X } from "lucide-react";
import { prepareUpload, saveDocument } from "@/app/(app)/egeszseg/dokumentumok/actions";
import { useToast } from "@/components/toast";
import { Alert, buttonClass, Field, Select } from "@/components/ui";
import { formatSize } from "@/lib/documents";
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
  const [picked, setPicked] = useState<File | null>(null);
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
      if (!picked) return setError("Válassz ki egy fájlt.");
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
      setPicked(null);
      setOpen(false);
    });

  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-4">
      <form ref={formRef} action={submit} className="flex flex-col gap-4">
        <input type="hidden" name="pet_id" value={petId} />
        {medicalEventId && <input type="hidden" name="medical_event_id" value={medicalEventId} />}
        <FileDrop
          file={picked}
          disabled={pending}
          onPick={(file) => {
            setError(null);
            setPicked(file);
          }}
        />
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
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setOpen(false);
            }}
            className={buttonClass("ghost")}
          >
            Mégse
          </button>
        </div>
      </form>
    </div>
  );
}

// Fájlválasztó: koppintásra tallóz, gépen ráhúzható a fájl; kiválasztás után
// előnézet (kép) vagy ikon (PDF) a névvel és mérettel.
function FileDrop({
  file,
  disabled,
  onPick,
}: {
  file: File | null;
  disabled: boolean;
  onPick: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setTimeout(() => setPreview(url));
    return () => {
      URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [file]);

  const accept = (list: FileList | null) => {
    const next = list?.[0];
    if (next && (next.type.startsWith("image/") || next.type === "application/pdf")) onPick(next);
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*,application/pdf"
      className="sr-only"
      aria-label="Fájl kiválasztása"
      onChange={(e) => {
        accept(e.target.files);
        e.target.value = "";
      }}
    />
  );

  if (file) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2.5">
        {input}
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <FileText size={26} aria-hidden="true" />
          </span>
        )}
        <div className="ml-1 min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{file.name}</p>
          <p className="text-xs text-text-muted">
            {file.type === "application/pdf" ? "PDF" : "Kép"} · {formatSize(file.size)}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          aria-label="Másik fájl választása"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted disabled:opacity-50"
        >
          <RefreshCw size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPick(null)}
          aria-label="Fájl eltávolítása"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted disabled:opacity-50"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files);
      }}
    >
      {input}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragging ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/60"
        }`}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Upload size={22} aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold">Fájl kiválasztása</span>
        <span className="text-xs text-text-muted">
          Kép vagy PDF, legfeljebb 20 MB. A fotókat automatikusan kisebbre tömörítjük.
        </span>
      </button>
    </div>
  );
}
