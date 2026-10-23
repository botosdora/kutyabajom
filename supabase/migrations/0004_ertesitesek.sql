-- 4. fázis: push értesítések.
-- Percenként fut egy időzített feladat (pg_cron), amely meghívja a
-- send-reminders Edge Functiont. Az kiszámolja az esedékes értesítéseket
-- (claim_notifications) és elküldi őket a feliratkozott eszközökre.
--
-- Előfeltétel (egyszer, kézzel, a titkos értékek miatt nem a repóban):
--   select vault.create_secret('<https://<ref>.supabase.co>', 'project_url');
--   select vault.create_secret('<CRON_SECRET>', 'cron_secret');

-- Beállítások a gazdi profilban ----------------------------------------------------

alter table public.profiles
  add column notify_doses boolean not null default true,
  add column notify_reminders boolean not null default true,
  add column daily_reminder_time time not null default '08:00';

-- Eszközök (böngészők), amelyek kérnek értesítést --------------------------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
create policy "Saját eszközök" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Feliratkozás mentése. Ha az eszközön korábban más volt bejelentkezve,
-- a régi feliratkozást átveszi az új felhasználó.
create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Nincs bejelentkezve';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, p_user_agent);
end;
$$;

-- Már elküldött értesítések, hogy semmi ne menjen ki kétszer.
create table public.notification_log (
  dedupe_key text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (dedupe_key, user_id)
);
alter table public.notification_log enable row level security;

-- Próbaértesítés kérése a beállításoknál.
create table public.notification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.notification_requests enable row level security;
create policy "Saját kérések" on public.notification_requests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Esedékes értesítések ----------------------------------------------------------------

-- Minden értesítés, aminek most (p_now) ki kellene mennie, felhasználónként.
-- A dedupe_key azonosítja, így a percenkénti futtatás nem küld duplán.
create function public.due_notifications(p_now timestamptz)
returns table (user_id uuid, dedupe_key text, title text, body text, url text)
language sql
stable
security definer set search_path = ''
as $$
  with clock as (
    select (p_now at time zone 'Europe/Budapest')::date as today,
           (p_now at time zone 'Europe/Budapest')::time as now_time
  ),
  members as (
    select pm.pet_id, pm.user_id, p.name as pet_name, pr.notify_doses, pr.notify_reminders,
           pr.daily_reminder_time
    from public.pet_members pm
    join public.pets p on p.id = pm.pet_id
    join public.profiles pr on pr.id = pm.user_id
    where pr.notifications_enabled
      and exists (select 1 from public.push_subscriptions s where s.user_id = pm.user_id)
  ),
  -- A napi emlékeztetők a gazdi által választott időpont után mehetnek ki.
  reminder_members as (
    select m.*, c.today from members m, clock c
    where m.notify_reminders and c.now_time >= m.daily_reminder_time
  )

  -- Gyógyszeradagok az időpontjukban (20 percig pótolva, ha addig nincs rögzítve).
  select m.user_id,
         'dose:' || d.medication_id || ':' || d.scheduled_for,
         m.pet_name || ': ' || d.name,
         concat_ws(' · ', d.dosage, to_char(d.scheduled_for at time zone 'Europe/Budapest', 'HH24:MI')),
         '/'
  from members m
  cross join clock c
  cross join lateral public.scheduled_doses(m.pet_id, c.today, c.today) d
  where m.notify_doses
    and d.status is null
    and d.scheduled_for between p_now - interval '20 minutes' and p_now + interval '30 seconds'

  union all
  -- Újravásárlás: 7 nappal előtte, előző nap és aznap.
  select m.user_id,
         'reorder:' || med.id || ':' || med.reorder_on || ':' || (med.reorder_on - m.today),
         m.pet_name || ': ' || med.name || ' újravásárlás',
         case med.reorder_on - m.today when 0 then 'Ma esedékes.' when 1 then 'Holnap esedékes.'
           else (med.reorder_on - m.today) || ' nap múlva esedékes.' end,
         '/gyogyszerek/' || med.id
  from reminder_members m
  join public.medications med on med.pet_id = m.pet_id and med.active
  where med.reorder_on - m.today in (7, 1, 0)

  union all
  -- Orvosi események: 5 nappal előtte és előző nap. Feladatok: előző nap.
  select m.user_id,
         'event:' || e.id || ':' || e.event_date || ':' || (e.event_date - m.today),
         m.pet_name || ': ' || e.title,
         case e.event_date - m.today when 1 then 'Holnap' else (e.event_date - m.today) || ' nap múlva' end
           || coalesce(', ' || to_char(e.event_time, 'HH24:MI'), '') || coalesce(' · ' || e.location, ''),
         '/naptar/' || e.id
  from reminder_members m
  join public.calendar_events e on e.pet_id = m.pet_id and e.status = 'planned'
  where (e.category = 'orvosi' and e.event_date - m.today in (5, 1))
     or (e.category = 'feladat' and e.event_date - m.today = 1)

  union all
  -- Lejáró oltás: 30 és 7 nappal előtte.
  select m.user_id,
         'vaccine:' || v.id || ':' || (v.valid_until - m.today),
         m.pet_name || ': ' || v.vaccine || ' oltás lejár',
         (v.valid_until - m.today) || ' nap múlva jár le.',
         '/egeszseg/oltasok'
  from reminder_members m
  join public.vaccinations v on v.pet_id = m.pet_id
  where v.valid_until - m.today in (30, 7)

  union all
  -- Az esemény napján: megtörtént? (az időpont után 1 órával, időpont nélkül 18:00-kor)
  select m.user_id,
         'followup:' || e.id || ':' || e.event_date,
         m.pet_name || ': megtörtént?',
         e.title || ' – koppints ide, és rögzítsd az eredményt.',
         '/naptar/' || e.id
  from members m
  cross join clock c
  join public.calendar_events e on e.pet_id = m.pet_id and e.status = 'planned' and e.event_date = c.today
  where m.notify_reminders
    and c.now_time >= coalesce(least(e.event_time, time '22:59') + interval '1 hour', time '18:00')

  union all
  -- Próbaértesítés.
  select r.user_id, 'test:' || r.id, 'Kutyabajom', 'Működnek az értesítések ezen az eszközön.', '/tobb'
  from public.notification_requests r
  where r.processed_at is null and r.created_at > p_now - interval '1 hour';
$$;

-- Lefoglalja (naplózza) az esedékes értesítéseket, és visszaadja a még el
-- nem küldötteket a címzett eszközeivel együtt.
create function public.claim_notifications(p_now timestamptz)
returns table (
  dedupe_key text,
  title text,
  body text,
  url text,
  subscription_id uuid,
  endpoint text,
  p256dh text,
  auth text
)
language plpgsql
security definer set search_path = ''
as $$
begin
  return query
  with due as (
    select * from public.due_notifications(p_now)
  ),
  claimed as (
    insert into public.notification_log (dedupe_key, user_id)
    select distinct d.dedupe_key, d.user_id from due d
    on conflict do nothing
    returning notification_log.dedupe_key, notification_log.user_id
  )
  select distinct on (c.dedupe_key, s.id)
         c.dedupe_key, d.title, d.body, d.url, s.id, s.endpoint, s.p256dh, s.auth
  from claimed c
  join due d on d.dedupe_key = c.dedupe_key and d.user_id = c.user_id
  join public.push_subscriptions s on s.user_id = c.user_id;

  update public.notification_requests set processed_at = p_now where processed_at is null;
  delete from public.notification_log where sent_at < p_now - interval '45 days';
end;
$$;

-- Ezeket csak a szerveroldali időzítő hívhatja, a böngészőből nem.
revoke execute on function public.due_notifications(timestamptz) from public, anon, authenticated;
revoke execute on function public.claim_notifications(timestamptz) from public, anon, authenticated;

-- Időzítés: percenként meghívja az Edge Functiont ------------------------------------

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'kutyabajom-ertesitesek',
  '* * * * *',
  $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
        || '/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 20000
    );
  $cron$
);
