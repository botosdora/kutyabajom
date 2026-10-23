import { EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Naptár" };

export default function Page() {
  return (
    <>
      <PageHeader title="Naptár" />
      <EmptyState>A naptár, az esedékes vizsgálatok és a feladatok a 3. fázisban érkeznek.</EmptyState>
    </>
  );
}
