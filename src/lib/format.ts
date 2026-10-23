// Dátumok és mennyiségek magyar megjelenítése.

const dateFormatter = new Intl.DateTimeFormat("hu-HU", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Europe/Budapest",
});

const shortDateFormatter = new Intl.DateTimeFormat("hu-HU", {
  month: "short",
  day: "numeric",
  timeZone: "Europe/Budapest",
});

// Az adatbázis "YYYY-MM-DD" formátumú dátumait délben értelmezzük, így az
// időzóna nem csúsztatja át őket előző vagy következő napra.
function parseDate(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

export function formatDate(value: string | null | undefined) {
  return value ? dateFormatter.format(parseDate(value)) : "–";
}

export function formatShortDate(value: string) {
  return shortDateFormatter.format(parseDate(value));
}

export function formatWeight(kg: number) {
  return `${kg.toLocaleString("hu-HU", { maximumFractionDigits: 2 })} kg`;
}

export function todayIso() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Budapest" }).format(new Date());
}

export function formatAge(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = parseDate(birthDate);
  const now = parseDate(todayIso());
  let months =
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 + now.getUTCMonth() - birth.getUTCMonth();
  if (now.getUTCDate() < birth.getUTCDate()) months -= 1;
  if (months < 0) return null;
  if (months < 12) return `${months} hónapos`;
  const years = Math.floor(months / 12);
  return `${years} éves`;
}
