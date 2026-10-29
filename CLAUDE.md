@AGENTS.md

# Kutyabajom – útmutató a projekten dolgozó Claude-nak

Kutyagondozási és egészségügyi nyilvántartó PWA. A felület és a felhasználóval
való kommunikáció **magyar**; a kód azonosítói angolok, a kommentek magyarok.
A felhasználó kezdő programozó: röviden, szakszavak nélkül magyarázz, és
amit lehet, csináld meg helyette (adatbázis, deploy, tesztelés).

## Stack és felépítés

- Next.js 16 App Router (lásd AGENTS.md: olvasd a `node_modules/next/dist/docs`
  vonatkozó részét, mielőtt Next-specifikus API-hoz nyúlsz). `cacheComponents`
  ki van kapcsolva; minden bejelentkezett oldal dinamikus. Middleware helyett `src/proxy.ts`.
- Supabase: Postgres + RLS, Auth (e-mail/jelszó, meghívókóddal), Storage
  (`documents` privát, `pet-photos` nyilvános véletlen névvel), Edge Functions
  (`send-reminders`, `admin-delete-user`), pg_cron, Vault.
- Adatmódosítás Server Actionökkel (`actions.ts` a route mellett), olvasás Server
  Componentekből a `src/lib/supabase/server.ts` klienssel. Böngészőből Supabase-t
  csak a fájlfeltöltés hív közvetlenül (aláírt feltöltési címmel).
- Környezeti változók: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (szerveroldali
  nevek, nem `NEXT_PUBLIC_`). A VAPID nyilvános kulcs a `src/lib/push.ts`-ben.

## Fontos szabályok és döntések

- **Jogosultság az adatbázisban.** Minden kutyához tartozó tábla `pet_id`-t és
  `is_pet_member(pet_id)` RLS szabályt kap (új táblánál is!). Új tábla → migráció
  RLS-sel együtt.
- **Admin** (`profiles.is_admin`, csak SQL-ből): meghívók, tárhely, felhasználók
  felfüggesztése/törlése. **Az admin sem lát mások kutyáinak adataiba** – ez a
  felhasználó kifejezett kérése, ne lazíts rajta.
- Regisztráció csak érvényes meghívókóddal (`handle_new_user` trigger ellenőrzi).
- Időzóna: minden „nap” és időpont Europe/Budapest szerint (`src/lib/format.ts`
  segédfüggvényei, SQL-ben `at time zone 'Europe/Budapest'`).
- Gyógyszeradagokat nem tárolunk előre: a `scheduled_doses()` SQL függvény számolja
  a `medication_periods` időszakaiból (kúrák; egyszeri alkalom = egynapos időszak),
  a rögzített beadás a `dose_logs`-ban van. Abbahagyáskor az időszak lezárul (nem törlődik),
  így a napló előzménye megmarad.
- Szerkesztés: a fejlécben ceruza ikon (`SheetLauncher`), az űrlap felugró panelben;
  új elem hozzáadása (`AddPanel`) szintén panelben nyílik.
- Diagramszínek: a validált kategóriás paletta (`--series-1..8` a `globals.css`-ben),
  rögzített sorrendben. Státuszszínek (`success`, `warning`, `danger`) csak állapotra.
- Felhasználói szövegek természetes magyarsággal; dátum `formatDate`, pénz `formatHuf`.

## Munkafolyamat

1. Adatbázis: új sorszámozott fájl a `supabase/migrations`-ben →
   `npm run db:migrate` → `npm run db:types`. (A Node fetch-hez a proxy miatt a
   szkriptek `NODE_USE_ENV_PROXY=1`-gyel futnak – a package.json ezt beállítja.)
2. Ellenőrzés: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
3. **Böngészős teszt** a tesztfelhasználóval (`teszt@kutyabajom.test`, egy
   „Morzsi” nevű kutyával): `npx next start` után Playwright (a globálisan
   telepített `playwright` modul, Chromium a `/opt/pw-browsers`-ben). Képernyőképpel
   is nézd meg, amit a felületen változtattál.
4. Commit magyar üzenettel; push a munkaágra **és** a `main`-re (a felhasználó
   engedélyével a sikeres teszt után közvetlenül élesíthető). A Vercel a
   `main`-ről deployol; az előnézeti (preview) deployok nem működnek.
5. Edge Function módosítás: deploy a Management API-val
   (`POST /v1/projects/{ref}/functions/deploy?slug=...`, multipart: metadata + fájl).

## Hasznos tudnivalók

- A tesztfelhasználó éles adatbázisban van; ideiglenes tesztfiókot SQL-lel lehet
  létrehozni (érvényes `invite_code` kell a metaadatban), utána töröld.
- Felfüggesztésnél `banned_until` távoli dátum (2999), **nem** `infinity` – azt a
  Supabase Auth nem tudja beolvasni.
- Az időzítő naplóját (`cron.job_run_details`) napi feladat takarítja.
- A Supabase ingyenes kerete bőven elég (lásd README); a tárhely a szűk keresztmetszet,
  ezért a képeket feltöltés előtt a böngésző tömöríti (`src/lib/image.ts`).
