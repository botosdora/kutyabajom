"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import { Camera, Trash2 } from "lucide-react";
import { preparePetPhotoUpload, setPetPhoto } from "@/app/(app)/actions";
import { PetAvatar } from "@/components/pet-switcher";
import { useToast } from "@/components/toast";
import { Alert, buttonClass } from "@/components/ui";
import { compressImage } from "@/lib/image";

export function PetPhotoUpload({
  petId,
  name,
  photoUrl,
  supabaseUrl,
  supabaseKey,
}: {
  petId: string;
  name: string;
  photoUrl: string | null;
  supabaseUrl: string;
  supabaseKey: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const upload = (picked: File) =>
    startTransition(async () => {
      setError(null);
      // Négyzetes, 512 pixeles JPEG: kicsi és gyorsan betölt.
      const file = await compressImage(picked, { maxSide: 512, quality: 0.85, square: true });
      const prepared = await preparePetPhotoUpload(petId);
      if ("error" in prepared) return setError(prepared.error ?? "Hiba történt.");
      const { error: uploadError } = await createClient(supabaseUrl, supabaseKey)
        .storage.from("pet-photos")
        .uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: "image/jpeg" });
      if (uploadError) return setError("A feltöltés nem sikerült. Próbáld újra.");
      await setPetPhoto(petId, prepared.path);
      toast("Fotó elmentve.");
    });

  return (
    <div className="flex flex-col items-center gap-3">
      <PetAvatar name={name} photoUrl={photoUrl} size={112} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Kutyafotó kiválasztása"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={() => inputRef.current?.click()} className={buttonClass("secondary")}>
          <Camera size={18} aria-hidden="true" /> {pending ? "Feltöltés…" : photoUrl ? "Fotó cseréje" : "Fotó feltöltése"}
        </button>
        {photoUrl && (
          <button
            type="button"
            disabled={pending}
            aria-label="Fotó törlése"
            onClick={() => startTransition(() => setPetPhoto(petId, null))}
            className={buttonClass("danger", "px-3")}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      {error && <Alert kind="error">{error}</Alert>}
    </div>
  );
}
