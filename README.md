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

### E-mail sablonok

A regisztrációs és jelszó-visszaállító levelek magyar sablonjai a
`supabase/email-templates` mappában vannak; ezeket a Supabase felületén kell
beállítani (Authentication → Emails).

## Fázisok

1. ✅ Regisztráció, kutyaprofilok, közös gazdik, adatlap, súly, allergiák és betegségek, oltások, orvosi beavatkozások, orvosok
2. Gyógyszerek és ütemezés, dashboard napi teendőkkel
3. Naptár, vizsgálatok, események, dokumentumfeltöltés
4. PWA push értesítések
5. Napló, trendek, étkezés, költségek, PDF exportok
