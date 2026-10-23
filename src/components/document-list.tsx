import { FileImage, FileText } from "lucide-react";
import { DeleteButton } from "@/components/forms";
import { deleteDocument } from "@/app/(app)/egeszseg/dokumentumok/actions";
import { docTypeLabel, formatSize } from "@/lib/documents";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

type Doc = Tables<"documents"> & { medical_events?: { title: string } | null };

// Dokumentumok listája; a megnyitáshoz egy óráig érvényes, aláírt linket kérünk.
export async function DocumentList({ docs }: { docs: Doc[] }) {
  const supabase = await createClient();
  const { data: urls } = docs.length
    ? await supabase.storage.from("documents").createSignedUrls(docs.map((d) => d.storage_path), 3600)
    : { data: [] };
  const urlFor = new Map((urls ?? []).map((u) => [u.path, u.signedUrl]));

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
      {docs.map((d) => {
        const Icon = d.mime_type?.startsWith("image/") ? FileImage : FileText;
        return (
          <li key={d.id} className="flex items-center gap-3 py-2.5 pl-4 pr-2">
            <Icon size={22} className="shrink-0 text-link" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <a
                href={urlFor.get(d.storage_path) ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-semibold text-link hover:opacity-80"
              >
                {d.title}
              </a>
              <p className="truncate text-xs text-text-muted">
                {[docTypeLabel(d.doc_type), formatDate(d.document_date), d.medical_events?.title, formatSize(d.size_bytes)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {d.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {d.tags.map((t) => (
                    <span key={t} className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <DeleteButton action={deleteDocument.bind(null, d.id)} confirmText="Biztosan törlöd a dokumentumot?" />
          </li>
        );
      })}
    </ul>
  );
}
