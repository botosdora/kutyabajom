-- Meghívókódos regisztráció, ismétlődő naptáresemények, laborértékek,
-- testkondíció-pontszám, örökbefogadás napja és szülinapi értesítés,
-- tárhely-kimutatás.

-- Meghívók ----------------------------------------------------------------------------

create table public.invites (
  code text primary key,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz
);

alter table public.invites enable row level security;
create policy "Saját meghívók" on public.invites
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());

-- Új meghívókód (8 karakter, könnyen begépelhető: nincs benne 0/O, 1/I).
create function public.create_invite(p_note text default null)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_code text;
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if auth.uid() is null then
    raise exception 'Nincs bejelentkezve';
  end if;
  loop
    select string_agg(substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1), '')
      into v_code from generate_series(1, 8);
    exit when not exists (select 1 from public.invites where code = v_code);
  end loop;
  insert into public.invites (code, created_by, note) values (v_code, auth.uid(), p_note);
  return v_code;
end;
$$;

-- Bejelentkezés nélkül is ellenőrizhető, hogy egy kód érvényes-e (a regisztrációs űrlaphoz).
create function public.invite_is_valid(p_code text)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.invites
    where code = upper(trim(p_code)) and used_by is null and expires_at > now()
  );
$$;
grant execute on function public.invite_is_valid(text) to anon, authenticated;

-- Regisztráció csak érvényes meghívókóddal: a kódot a regisztráció adataiban
-- (invite_code) kell küldeni, és felhasználáskor megjelöljük.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_code text := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));
begin
  update public.invites
     set used_by = new.id, used_at = now()
   where code = v_code and used_by is null and expires_at > now();
  if not found then
    raise exception 'Érvénytelen vagy lejárt meghívókód' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;

-- Ismétlődő naptáresemények -------------------------------------------------------------
-- Egy sorozat minden alkalma külön sor (saját állapottal); a series_id köti össze őket.

alter table public.calendar_events
  add column series_id uuid,
  add column repeat_rule text check (repeat_rule in ('daily', 'weekly', 'monthly', 'yearly')),
  add column repeat_interval integer check (repeat_interval is null or repeat_interval > 0);

create index calendar_events_series_idx on public.calendar_events (series_id);

-- Laborértékek ----------------------------------------------------------------------------

create table public.lab_results (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  measured_on date not null,
  parameter text not null,
  value numeric not null,
  unit text,
  ref_low numeric,
  ref_high numeric,
  medical_event_id uuid references public.medical_events (id) on delete set null,
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index lab_results_pet_idx on public.lab_results (pet_id, parameter, measured_on);
alter table public.lab_results enable row level security;
create policy "Gazdák kezelik" on public.lab_results
  for all using (public.is_pet_member(pet_id)) with check (public.is_pet_member(pet_id));

-- Testkondíció és örökbefogadás ----------------------------------------------------------------

alter table public.weights
  add column body_condition smallint check (body_condition between 1 and 9);

alter table public.pets add column adoption_date date;

-- Tárhely-kimutatás (az egész projekt foglalása, az 1 GB-os ingyenes kerethez) -----------------

create function public.storage_usage()
returns table (bucket text, files bigint, bytes bigint)
language sql
stable
security definer set search_path = ''
as $$
  select bucket_id, count(*), coalesce(sum((metadata ->> 'size')::bigint), 0)
  from storage.objects
  where bucket_id in ('documents', 'pet-photos')
  group by bucket_id;
$$;
revoke execute on function public.storage_usage() from public, anon;
grant execute on function public.storage_usage() to authenticated;
