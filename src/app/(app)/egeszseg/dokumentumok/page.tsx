import Link from "next/link";
import { DocumentList } from "@/components/document-list";
import { DocumentUpload } from "@/components/document-upload";
import { FileText } from "lucide-react";
import { EmptyState, LoadMore, PageHeader, pageLimit } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { DOC_TYPES } from "@/lib/documents";
import { formatDate, todayIso } from "@/lib/format";
import { requireCurrentPet } from "@/lib/pets";

export const metadata = { title: "Dokumentumok" };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ tipus?: string; cimke?: string; db?: string; uj?: string }> }) {
  const pet = await requireCurrentPet();
  const { tipus, cimke, db, uj } = await searchParams;
  const limit = pageLimit(db);
  const supabase = await createClient();

  let query = supabase
    .from("documents")
    .select("*, medical_events(title)")
    .eq("pet_id", pet.id)
    .order("document_date", { ascending: false });
  if (tipus) query = query.eq("doc_type", tipus);
  if (cimke) query = query.contains("tags", [cimke]);

  const [{ data: docs }, { data: events }, { data: allTags }] = await Promise.all([
    query,
    supabase.from("medical_events").select("id, title, event_date").eq("pet_id", pet.id).order("event_date", { ascending: false }).limit(30),
    supabase.from("documents").select("tags").eq("pet_id", pet.id),
  ]);
  const tags = [...new Set((allTags ?? []).flatMap((d) => d.tags))].sort((a, b) => a.localeCompare(b, "hu"));

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`flex h-9 items-center rounded-full px-3 text-sm font-medium ${
        active ? "bg-primary text-on-primary" : "border border-border-strong hover:bg-surface-muted"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader title="Dokumentumok" subtitle={pet.name} back={{ href: "/egeszseg", label: "Egészség" }} icon={FileText} />

      <div className="mb-4">
        <DocumentUpload
          petId={pet.id}
          supabaseUrl={supabaseUrl}
          supabaseKey={supabaseKey}
          docTypes={DOC_TYPES}
          today={todayIso()}
          defaultOpen={uj === "1"}
          events={[
            { value: "", label: "– egyikhez sem –" },
            ...(events ?? []).map((e) => ({ value: e.id, label: `${e.title} (${formatDate(e.event_date)})` })),
          ]}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {chip("/egeszseg/dokumentumok", "Mind", !tipus && !cimke)}
        {DOC_TYPES.map((t) => chip(`/egeszseg/dokumentumok?tipus=${t.value}`, t.label, tipus === t.value))}
      </div>
      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((t) => chip(`/egeszseg/dokumentumok?cimke=${encodeURIComponent(t)}`, `# ${t}`, cimke === t))}
        </div>
      )}

      {docs?.length ? <DocumentList docs={docs.slice(0, limit)} /> : <EmptyState>Nincs dokumentum.</EmptyState>}
      <LoadMore
        shown={Math.min(limit, docs?.length ?? 0)}
        total={docs?.length ?? 0}
        href={(n) => `/egeszseg/dokumentumok?${new URLSearchParams({ ...(tipus ? { tipus } : {}), ...(cimke ? { cimke } : {}), db: String(n) })}`}
      />
    </>
  );
}
