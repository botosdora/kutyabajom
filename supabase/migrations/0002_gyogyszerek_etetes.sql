-- 2. fázis: gyógyszerek és kiegészítők ütemezéssel, beadások naplója,
-- vásárlások, napi etetés (reggeli, vacsora).

-- Gyógyszerek -------------------------------------------------------------------

-- Az ütemezés egyetlen szabály: start_date-től (és ha van, end_date-ig)
-- minden interval_days-adik napon, a times-ban megadott időpontokban.
-- interval_days = null: egyszeri alkalom a start_date napján.
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  name text not null,
  category text not null default 'gyogyszer'
    check (category in ('gyogyszer', 'feregtelenites', 'kiegeszito')),
  dosage text,
  schedule_type text not null default 'recurring'
    check (schedule_type in ('once', 'recurring', 'course')),
  start_date date not null,
  end_date date,
  interval_days integer check (interval_days is null or interval_days > 0),
  times time[] not null default '{08:00}',
  reorder_on date,
  notes text,
  active boolean not null default true,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  check (cardinality(times) > 0)
);

create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  scheduled_for timestamptz not null,
  status text not null check (status in ('given', 'missed', 'refused')),
  given_at timestamptz,
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (medication_id, scheduled_for)
);

create table public.medication_purchases (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  purchased_on date not null default current_date,
  quantity text,
  cost_huf integer check (cost_huf is null or cost_huf >= 0),
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- A beadás és a vásárlás kutyáját mindig a gyógyszerből vesszük, így nem lehet
-- másik kutyához tartozó gyógyszerhez rögzíteni.
create function public.set_pet_from_medication()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select pet_id into new.pet_id from public.medications where id = new.medication_id;
  return new;
end;
$$;

create trigger dose_logs_set_pet before insert or update on public.dose_logs
  for each row execute function public.set_pet_from_medication();
create trigger medication_purchases_set_pet before insert or update on public.medication_purchases
  for each row execute function public.set_pet_from_medication();

create index medications_pet_idx on public.medications (pet_id, active);
create index dose_logs_pet_idx on public.dose_logs (pet_id, scheduled_for);
create index medication_purchases_med_idx on public.medication_purchases (medication_id, purchased_on);

-- Etetés -------------------------------------------------------------------------

alter table public.pets
  add column breakfast_time time not null default '08:00',
  add column dinner_time time not null default '18:00';

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  day date not null,
  meal text not null check (meal in ('reggeli', 'vacsora')),
  status text not null check (status in ('eaten', 'partial', 'refused')),
  logged_at timestamptz not null default now(),
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  unique (pet_id, day, meal)
);

-- Jogosultságok ------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['medications', 'dose_logs', 'medication_purchases', 'meal_logs']
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

-- Esedékes adagok egy időszakra ----------------------------------------------------

-- Minden aktív gyógyszer minden esedékes alkalma a megadott napokon (budapesti
-- idő szerint), a már rögzített beadással együtt. A hívó jogosultságaival fut,
-- így csak a saját kutyák adatait adja vissza.
create function public.scheduled_doses(p_pet_id uuid, p_from date, p_to date)
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
  select
    m.id,
    m.name,
    m.dosage,
    m.category,
    d.day,
    (d.day + t.at) at time zone 'Europe/Budapest',
    l.id,
    l.status,
    l.given_at
  from public.medications m
  cross join lateral (
    select g::date as day
    from generate_series(greatest(p_from, m.start_date), least(p_to, coalesce(m.end_date, p_to)), interval '1 day') g
  ) d
  cross join lateral unnest(m.times) as t (at)
  left join public.dose_logs l
    on l.medication_id = m.id
   and l.scheduled_for = (d.day + t.at) at time zone 'Europe/Budapest'
  where m.pet_id = p_pet_id
    and m.active
    and case
      when m.interval_days is null then d.day = m.start_date
      else (d.day - m.start_date) % m.interval_days = 0
    end
  order by 6, 2;
$$;
