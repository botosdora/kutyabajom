// Percenként hívja az adatbázis időzítője (pg_cron). Lekéri az esedékes
// értesítéseket, és elküldi őket push értesítésként a feliratkozott eszközökre.
import webpush from "npm:web-push@3.6.7";
import postgres from "npm:postgres@3.4.5";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 1 });

webpush.setVapidDetails(
  "https://kutyabajom.vercel.app",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

type Row = {
  dedupe_key: string;
  title: string;
  body: string;
  url: string;
  subscription_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await sql<Row[]>`select * from public.claim_notifications(now())`;
  let sent = 0;
  const expired: string[] = [];

  await Promise.all(
    rows.map(async (r) => {
      try {
        await webpush.sendNotification(
          { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
          JSON.stringify({ title: r.title, body: r.body, url: r.url, tag: r.dedupe_key }),
          { TTL: 60 * 60 },
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // A böngésző visszavonta a feliratkozást: töröljük.
        if (status === 404 || status === 410) expired.push(r.subscription_id);
        else console.error("Küldési hiba", status, (err as Error).message);
      }
    }),
  );

  if (expired.length) await sql`delete from public.push_subscriptions where id = any(${expired})`;
  return Response.json({ due: rows.length, sent, expired: expired.length });
});
