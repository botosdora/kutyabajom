import { EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Napló" };

export default function Page() {
  return (
    <>
      <PageHeader title="Napló" />
      <EmptyState>A napi napló (hangulat, étvágy, mozgás, fájdalom…) az 5. fázisban érkezik.</EmptyState>
    </>
  );
}
