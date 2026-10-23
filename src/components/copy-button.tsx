"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/components/toast";

// Meghívó link másolása (vagy telefonon megosztása) – a link a böngésző címéből áll össze.
export function InviteShareButton({ code }: { code: string }) {
  const toast = useToast();
  const share = async () => {
    const url = `${window.location.origin}/regisztracio?kod=${code}`;
    const text = `Meghívó a Kutyabajomba. Regisztrálj ezzel a linkkel: ${url} (meghívókód: ${code})`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Kutyabajom meghívó", text, url });
        return;
      } catch {
        // a megosztást megszakították: marad a másolás
      }
    }
    await navigator.clipboard.writeText(text);
    toast("Meghívó link kimásolva.");
  };
  return (
    <button
      type="button"
      onClick={share}
      className="flex h-9 items-center gap-1.5 rounded-lg bg-primary-soft px-3 text-sm font-semibold text-link hover:opacity-80"
    >
      <Share2 size={16} aria-hidden="true" />
      Küldés
    </button>
  );
}
