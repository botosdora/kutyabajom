-- Gyógyszer-időszakok (kúrák): az ütemezés a gyógyszer helyett időszakonként
-- tárolódik, így egy új kúra nem írja felül a korábbit, és az abbahagyott
-- gyógyszer előzménye a naplóban megmarad (az időszak lezárul, nem tűnik el).
-- Egyszeri alkalom = egynapos időszak.

create table public.medication_periods (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  start_date date not null,
  end_date date,
  interval_days integer not null default 1 check (interval_days > 0),
  times time[] not null default '{08:00}' check (cardinality(times) > 0),
  -- Ha üres, a gyógyszernél megadott adag érvényes.
  dosage text,
  stop_reason text check (stop_reason in ('kura_vege', 'mellekhatas', 'nem_segitett', 'orvos', 'elfogyott', 'egyeb')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create trigger medication_periods_set_pet before insert or update on public.medication_periods
  for each row execute function public.set_pet_from_medication();
create index medication_periods_med_idx on public.medication_periods (medication_id, start_date);
create index medication_periods_pet_idx on public.medication_periods (pet_id, start_date);

alter table public.medication_periods enable row level security;
create policy "Gazdák kezelik" on public.medication_periods
  for all using (public.is_pet_member(pet_id)) with check (public.is_pet_member(pet_id));

-- Meglévő adatok átvitele ---------------------------------------------------------------

-- Ismétlődő és kúra: egy időszak. A már nem szedettnél a vége a kúra vége vagy
-- az utolsó rögzített beadás (amelyik korábbi), legalább a kezdő nap.
insert into public.medication_periods (medication_id, pet_id, start_date, end_date, interval_days, times)
select m.id, m.pet_id, m.start_date,
       case when m.active then m.end_date
            else greatest(m.start_date, coalesce(least(m.end_date, (
              select max((l.scheduled_for at time zone 'Europe/Budapest')::date)
              from public.dose_logs l where l.medication_id = m.id)), m.start_date))
       end,
       coalesce(m.interval_days, 1), m.times
from public.medications m
where m.schedule_type <> 'once';

-- Egyszeri: minden alkalom egy egynapos időszak.
insert into public.medication_periods (medication_id, pet_id, start_date, end_date, interval_days, times)
select m.id, m.pet_id, d, d, 1, m.times
from public.medications m
cross join lateral (select distinct unnest(m.once_dates || m.start_date) as d) dates
where m.schedule_type = 'once';

alter table public.medications
  drop column start_date,
  drop column end_date,
  drop column interval_days,
  drop column times,
  drop column once_dates;

-- Adagok az időszakokból ------------------------------------------------------------------

create or replace function public.scheduled_doses(p_pet_id uuid, p_from date, p_to date)
returns table (
  medication_id uuid,
  name text,
  dosage text,
  category text,
  day date,
  scheduled_for timestamptz,
  log_id uuid,
  status text,
  given_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select distinct on (6, m.id)
    m.id,
    m.name,
    coalesce(p.dosage, m.dosage),
    m.category,
    d.day,
    (d.day + t.at) at time zone 'Europe/Budapest',
    l.id,
    l.status,
    l.given_at
  from public.medications m
  join public.medication_periods p on p.medication_id = m.id
  cross join lateral (
    select g::date as day
    from generate_series(greatest(p_from, p.start_date), least(p_to, coalesce(p.end_date, p_to)), interval '1 day') g
  ) d
  cross join lateral unnest(p.times) as t (at)
  left join public.dose_logs l
    on l.medication_id = m.id
   and l.scheduled_for = (d.day + t.at) at time zone 'Europe/Budapest'
  where m.pet_id = p_pet_id
    and (d.day - p.start_date) % p.interval_days = 0
  order by 6, m.id, m.name;
$$;

-- Újravásárlási értesítés csak a még szedett gyógyszerekhez --------------------------------

create or replace function public.due_notifications(p_now timestamptz)
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
  reminder_members as (
    select m.*, c.today from members m, clock c
    where m.notify_reminders and c.now_time >= m.daily_reminder_time
  )

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
  select m.user_id,
         'reorder:' || med.id || ':' || med.reorder_on || ':' || (med.reorder_on - m.today),
         m.pet_name || ': ' || med.name || ' újravásárlás',
         case med.reorder_on - m.today when 0 then 'Ma esedékes.' when 1 then 'Holnap esedékes.'
           else (med.reorder_on - m.today) || ' nap múlva esedékes.' end,
         '/gyogyszerek/' || med.id
  from reminder_members m
  join public.medications med on med.pet_id = m.pet_id and med.active
  where med.reorder_on - m.today in (7, 1, 0)
    -- Csak ha még szedi (van folyamatban lévő vagy jövőbeli időszaka; egyszerinél elég, hogy aktív).
    and (med.schedule_type = 'once' or exists (
      select 1 from public.medication_periods mp
      where mp.medication_id = med.id and (mp.end_date is null or mp.end_date >= m.today)))

  union all
  select m.user_id,
         'food:' || f.id || ':' || f.reorder_on || ':' || (f.reorder_on - m.today),
         m.pet_name || ': ' || f.name || ' újrarendelés',
         case f.reorder_on - m.today when 0 then 'Ma esedékes.' when 1 then 'Holnap esedékes.'
           else (f.reorder_on - m.today) || ' nap múlva esedékes.' end,
         '/etkezes/' || f.id
  from reminder_members m
  join public.foods f on f.pet_id = m.pet_id and f.status = 'active'
  where f.reorder_on - m.today in (7, 1, 0)

  union all
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
  select m.user_id,
         'vaccine:' || v.id || ':' || (v.valid_until - m.today),
         m.pet_name || ': ' || v.vaccine || ' oltás lejár',
         (v.valid_until - m.today) || ' nap múlva jár le.',
         '/egeszseg/oltasok'
  from reminder_members m
  join public.vaccinations v on v.pet_id = m.pet_id
  where v.valid_until - m.today in (30, 7)

  union all
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
  -- Szülinap és a hozzánk kerülés évfordulója (a napi emlékeztető időpontjában).
  select m.user_id,
         'birthday:' || p.id || ':' || m.today,
         'Boldog szülinapot, ' || p.name || '!',
         p.name || ' ma ' || (extract(year from age(m.today, p.birth_date)))::int || ' éves.',
         '/'
  from reminder_members m
  join public.pets p on p.id = m.pet_id
  where p.birth_date is not null
    and to_char(p.birth_date, 'MM-DD') = to_char(m.today, 'MM-DD')
    and p.birth_date < m.today

  union all
  select m.user_id,
         'adoption:' || p.id || ':' || m.today,
         p.name || ' évfordulója',
         'Ma ' || (extract(year from age(m.today, p.adoption_date)))::int || ' éve van veletek.',
         '/'
  from reminder_members m
  join public.pets p on p.id = m.pet_id
  where p.adoption_date is not null
    and to_char(p.adoption_date, 'MM-DD') = to_char(m.today, 'MM-DD')
    and p.adoption_date < m.today

  union all
  select r.user_id, 'test:' || r.id, 'Kutyabajom', 'Működnek az értesítések ezen az eszközön.', '/egyeb'
  from public.notification_requests r
  where r.processed_at is null and r.created_at > p_now - interval '1 hour';
$$;

revoke execute on function public.due_notifications(timestamptz) from public, anon, authenticated;
