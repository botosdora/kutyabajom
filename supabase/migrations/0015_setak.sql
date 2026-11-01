-- Séták: a kutya napi sétáinak időpontjai, és sétánként hogy volt-e pisi, kaki.
-- Egy walk_logs sor = megvolt egy séta (a beállított időpontban vagy extra sétaként).

alter table public.pets add column walk_times time[] not null default '{}';

create table public.walk_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  day date not null,
  -- A séta időpontja: beállított sétánál a beállított idő, extránál a tényleges.
  time time not null,
  scheduled boolean not null default true,
  pee boolean not null default false,
  poop boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Egy beállított sétaidőponthoz naponta egy sor; extra sétából több is lehet.
create unique index walk_logs_slot_idx on public.walk_logs (pet_id, day, time) where scheduled;
create index walk_logs_pet_day_idx on public.walk_logs (pet_id, day);

alter table public.walk_logs enable row level security;
create policy "Gazdák kezelik" on public.walk_logs
  for all using (public.is_pet_member(pet_id)) with check (public.is_pet_member(pet_id));
