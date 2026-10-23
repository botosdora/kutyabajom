# Kutyabajom

Kutyagondozási és egészségügyi nyilvántartó webapp: adatlap, oltások, orvosi
események, gyógyszerek, napló, költségek – egy helyen, több gazdával közösen.

## Technológia

- **Next.js** (App Router, TypeScript) – az app
- **Supabase** – adatbázis (Postgres), bejelentkezés, fájltárolás
- **Tailwind CSS** – megjelenés
- **Recharts** – diagramok
- **Vercel** – hosting

## Fejlesztés

```bash
cp .env.example .env.local   # majd töltsd ki a Supabase adatokkal
npm install
npm run dev                  # http://localhost:3000
```

### Adatbázis

Az adatbázis szerkezete a `supabase/migrations` mappában van, sorszámozott SQL
fájlokban. Új fájl lefuttatása és a TypeScript típusok frissítése:

```bash
npm run db:migrate   # SUPABASE_ACCESS_TOKEN és SUPABASE_PROJECT_REF kell hozzá
npm run db:types
```

Minden kutyához tartozó adatot sorszintű biztonság (RLS) véd: csak a kutya
gazdái (`pet_members`) férnek hozzá.

### PDF exportok

A `/export/gyogyszerek`, `/export/egeszseg` és `/export/naplo` útvonalak `@react-pdf/renderer`-rel
készítenek PDF-et. A magyar ékezetekhez az Inter betűtípus a `src/fonts` mappában van.

### Értesítések

- Az app telepíthető (PWA), a `public/sw.js` service worker jeleníti meg a push értesítéseket.
- Percenként fut egy `pg_cron` feladat, amely meghívja a `send-reminders` Edge Functiont
  (`supabase/functions/send-reminders`). Ez a `claim_notifications` SQL függvénnyel kéri le az
  esedékes értesítéseket, és elküldi őket.
- Titkos értékek (nem a repóban): Supabase Edge Function secretek (`VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY`, `CRON_SECRET`) és Vault (`project_url`, `cron_secret`).

### E-mail sablonok

A regisztrációs és jelszó-visszaállító levelek magyar sablonjai a
`supabase/email-templates` mappában vannak; ezeket a Supabase felületén kell
beállítani (Authentication → Emails).

## Fázisok

1. ✅ Regisztráció, kutyaprofilok, közös gazdik, adatlap, súly, allergiák és betegségek, oltások, orvosi beavatkozások, orvosok
2. ✅ Gyógyszerek és ütemezés, dashboard napi teendőkkel
3. ✅ Naptár, vizsgálatok, események, dokumentumfeltöltés, költségek
4. ✅ PWA push értesítések
5. ✅ Napló, trendek, étkezés (tápok), PDF exportok
