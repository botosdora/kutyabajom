import { notFound } from "next/navigation";
import { HardDrive, ShieldCheck, Ticket, Users } from "lucide-react";
import { AdminDeleteUser } from "@/components/admin-delete";
import { InviteShareButton } from "@/components/copy-button";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/forms";
import { Alert, buttonClass, Card, Field, PageHeader, SectionTitle } from "@/components/ui";
import { formatSize } from "@/lib/documents";
import { formatDate } from "@/lib/format";
import { getIsAdmin, requireUser } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";
import { createInvite, deleteInvite } from "../actions";
import { deleteUser, setSuspended } from "./actions";

export const metadata = { title: "Adminisztráció" };

const STORAGE_LIMIT = 1024 * 1024 * 1024;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ torolve?: string; kutya?: string; fajl?: string }>;
}) {
  const { torolve, kutya, fajl } = await searchParams;
  if (!(await getIsAdmin())) notFound();
  const me = await requireUser();
  const supabase = await createClient();
  const [{ data: users }, { data: invites }, { data: usage }] = await Promise.all([
    supabase.rpc("admin_users"),
    supabase.from("invites").select("*").order("created_at", { ascending: false }).limit(15),
    supabase.rpc("storage_usage"),
  ]);
  const usedBytes = (usage ?? []).reduce((sum, u) => sum + Number(u.bytes), 0);
  const usedFiles = (usage ?? []).reduce((sum, u) => sum + Number(u.files), 0);
  const usedPct = Math.min(100, (usedBytes / STORAGE_LIMIT) * 100);
  const now = new Date().toISOString();

  return (
    <>
      <PageHeader title="Adminisztráció" subtitle="Csak te látod" back={{ href: "/egyeb", label: "Egyéb" }} icon={ShieldCheck} />

      {torolve && (
        <div className="mb-4">
          <Alert kind="success">
            {torolve} fiókja törölve ({kutya ?? 0} kutya és {fajl ?? 0} fájl törlődött vele).
          </Alert>
        </div>
      )}

      <section className="mb-6">
        <SectionTitle icon={Ticket}>Meghívók</SectionTitle>
        <Card className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            Regisztrálni csak meghívókóddal lehet. Egy kód egyszer használható fel, és 14 napig érvényes.
          </p>
          <ActionForm action={createInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Kinek? (nem kötelező)" name="note" placeholder="pl. Anya" />
            </div>
            <SubmitButton pendingText="Készül…">Új meghívó</SubmitButton>
          </ActionForm>
          {!!invites?.length && (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {invites.map((inv) => {
                const used = !!inv.used_by;
                const expired = !used && inv.expires_at < now;
                return (
                  <li key={inv.code} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[15px] font-bold tracking-wider">{inv.code}</span>
                      <span className="block text-xs text-text-muted">
                        {inv.note ? `${inv.note} · ` : ""}
                        {used
                          ? `felhasználva ${formatDate(inv.used_at!.slice(0, 10))}`
                          : expired
                            ? "lejárt"
                            : `érvényes ${formatDate(inv.expires_at.slice(0, 10))}-ig`}
                      </span>
                    </span>
                    {!used && !expired && <InviteShareButton code={inv.code} />}
                    {!used && <DeleteButton action={deleteInvite.bind(null, inv.code)} confirmText="Törlöd a meghívót?" />}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle icon={HardDrive}>Tárhely</SectionTitle>
        <Card>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium">Dokumentumok és fotók</span>
            <span className="text-text-muted">{formatSize(usedBytes) || "0 KB"} / 1 GB</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(usedPct, 1)}%`,
                background: usedPct > 80 ? "var(--danger)" : usedPct > 60 ? "var(--warning)" : "var(--primary)",
              }}
            />
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {usedFiles} fájl · az ingyenes tárhely {usedPct.toLocaleString("hu-HU", { maximumFractionDigits: 1 })}%-a foglalt.
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle icon={Users} action={<span className="text-sm text-text-muted">{users?.length ?? 0} fiók</span>}>
          Felhasználók
        </SectionTitle>
        <p className="mb-2 text-sm text-text-muted">
          Itt csak a fiókok adatai látszanak – a többiek kutyáinak adataiba az admin sem lát bele.
        </p>
        <ul className="flex flex-col gap-2">
          {(users ?? []).map((u) => (
            <li key={u.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {u.full_name || "Névtelen"}
                    {u.id === me.id && <span className="font-normal text-text-muted"> (te)</span>}
                  </p>
                  <p className="truncate text-sm text-text-muted">{u.email}</p>
                </div>
                {u.is_admin ? (
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-link">Admin</span>
                ) : u.suspended ? (
                  <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">Felfüggesztve</span>
                ) : (
                  <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">Aktív</span>
                )}
              </div>
              <p className="mt-2 text-xs text-text-muted">
                Regisztrált: {formatDate(u.created_at.slice(0, 10))} · Utolsó belépés:{" "}
                {u.last_sign_in_at ? formatDate(u.last_sign_in_at.slice(0, 10)) : "még nem lépett be"} · {u.pets} kutya ·{" "}
                {formatSize(Number(u.storage_bytes)) || "0 KB"}
              </p>
              {!u.is_admin && u.id !== me.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={setSuspended.bind(null, u.id, !u.suspended)}>
                    <button type="submit" className={buttonClass("secondary", "h-9 px-3 text-sm")}>
                      {u.suspended ? "Felfüggesztés feloldása" : "Felfüggesztés"}
                    </button>
                  </form>
                  <AdminDeleteUser action={deleteUser} userId={u.id} email={u.email} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
