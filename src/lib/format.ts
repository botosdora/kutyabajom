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

const timeFormatter = new Intl.DateTimeFormat("hu-HU", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Budapest",
});

const dateTimeDateFormatter = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Budapest" });

// Egy UTC időbélyeg budapesti napja "YYYY-MM-DD" formában.
export function budapestDay(iso: string) {
  return dateTimeDateFormatter.format(new Date(iso));
}

// Időpont (pl. "08:05") egy UTC időbélyegből, budapesti idő szerint.
export function formatTime(iso: string) {
  return timeFormatter.format(new Date(iso));
}

// Az adatbázis "08:00:00" formátumú időpontjából "08:00".
export function shortTime(time: string) {
  return time.slice(0, 5);
}

export function formatHuf(amount: number) {
  return `${amount.toLocaleString("hu-HU")} Ft`;
}

function budapestOffsetMinutes(instant: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Budapest",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUtc - instant.getTime()) / 60000;
}

// Budapesti dátum + időpont ("2026-10-23", "08:15") → UTC ISO időbélyeg.
export function budapestToIso(date: string, time: string) {
  const guess = new Date(`${date}T${time}:00Z`);
  return new Date(guess.getTime() - budapestOffsetMinutes(guess) * 60000).toISOString();
}

export function addDays(iso: string, days: number) {
  return new Date(Date.parse(`${iso}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((Date.parse(`${toIso}T12:00:00Z`) - Date.parse(`${fromIso}T12:00:00Z`)) / 86400000);
}

export function inDaysLabel(days: number) {
  if (days === 0) return "ma";
  if (days === 1) return "holnap";
  if (days < 0) return `${-days} napja lejárt`;
  return `${days} nap múlva`;
}
