// Oldalváltáskor azonnal megjelenő váz (fejléc és kártyák körvonala), amíg az
// adatok megérkeznek – így nem villan üres képernyő.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Betöltés…" className="flex flex-col gap-4">
      <div className="mb-2 flex items-center gap-3">
        <span className="skeleton size-11 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <span className="skeleton h-3 w-20 rounded-full" />
          <span className="skeleton h-6 w-44 rounded-full" />
        </div>
      </div>
      <span className="skeleton h-28 rounded-2xl" />
      <span className="skeleton h-4 w-32 rounded-full" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border p-3">
          <span className="skeleton size-10 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <span className="skeleton h-3.5 w-3/5 rounded-full" />
            <span className="skeleton h-3 w-2/5 rounded-full" />
          </div>
        </div>
      ))}
      <span className="skeleton h-40 rounded-2xl" />
    </div>
  );
}
