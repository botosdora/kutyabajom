-- 5. fázis: napi napló, tápok és jutalomfalatok, tápvásárlások.

-- Napi napló (kutyánként naponta egy bejegyzés) ---------------------------------------

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  day date not null,
  mood smallint check (mood between 0 and 10),
  appetite smallint check (appetite between 0 and 10),
  activity smallint check (activity between 0 and 10),
  pain smallint check (pain between 0 and 10),
  pain_duration text,
  water smallint check (water between 0 and 10),
  water_ml integer check (water_ml is null or water_ml >= 0),
  stool text check (stool in ('normalis', 'lagy', 'hasmenes', 'szekrekedes', 'nem_volt')),
  observations text[] not null default '{}',
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (pet_id, day)
);

create index daily_logs_pet_idx on public.daily_logs (pet_id, day);

-- Tápok és jutalomfalatok ---------------------------------------------------------------

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  kind text not null default 'tap' check (kind in ('tap', 'jutalomfalat')),
  name text not null,
  food_type text,
  daily_grams numeric(7, 1) check (daily_grams is null or daily_grams >= 0),
  reorder_on date,
  status text not null default 'active' check (status in ('active', 'past', 'failed')),
  fail_reason text,
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.food_purchases (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  purchased_on date not null default current_date,
  quantity text,
  cost_huf integer check (cost_huf is null or cost_huf >= 0),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create function public.set_pet_from_food()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select pet_id into new.pet_id from public.foods where id = new.food_id;
  return new;
end;
$$;

create trigger food_purchases_set_pet before insert or update on public.food_purchases
  for each row execute function public.set_pet_from_food();

create index foods_pet_idx on public.foods (pet_id, status);
create index food_purchases_food_idx on public.food_purchases (food_id, purchased_on);

do $$
declare
  t text;
begin
  foreach t in array array['daily_logs', 'foods', 'food_purchases']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "Gazdák kezelik" on public.%I for all
         using (public.is_pet_member(pet_id))
         with check (public.is_pet_member(pet_id))',
      t
    );
  end loop;
end;
$$;

-- A tápvásárlások is megjelennek a költségek között --------------------------------------

create or replace view public.all_expenses with (security_invoker = true) as
  select
    e.id,
    e.pet_id,
    e.spent_on,
    e.category,
    e.amount_huf,
    e.title,
    e.notes,
    'expense'::text as source,
    e.medical_event_id,
    null::uuid as medication_id
  from public.expenses e
  union all
  select p.id, p.pet_id, p.purchased_on, 'gyogyszer', p.cost_huf, m.name, p.quantity,
         'medication_purchase', null, p.medication_id
  from public.medication_purchases p
  join public.medications m on m.id = p.medication_id
  where p.cost_huf is not null
  union all
  select p.id, p.pet_id, p.purchased_on, 'etel', p.cost_huf, f.name, p.quantity,
         'food_purchase', null, null
  from public.food_purchases p
  join public.foods f on f.id = p.food_id
  where p.cost_huf is not null;

-- Táp újrarendelési értesítés (7 nappal előtte, előző nap, aznap) ---------------------------

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
  select r.user_id, 'test:' || r.id, 'Kutyabajom', 'Működnek az értesítések ezen az eszközön.', '/tobb'
  from public.notification_requests r
  where r.processed_at is null and r.created_at > p_now - interval '1 hour';
$$;

revoke execute on function public.due_notifications(timestamptz) from public, anon, authenticated;
