-- 1. fázis: gazdi profil, kutyák, közös gazdik, adatlap (súly, allergiák,
-- betegségek, orvosok, oltások, orvosi beavatkozások).
-- Minden kutyához tartozó adatot sorszintű biztonság (RLS) véd: csak a kutya
-- gazdái láthatják és módosíthatják.

-- Gazdi profil ---------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Saját profil olvasása" on public.profiles
  for select using (id = auth.uid());
create policy "Saját profil módosítása" on public.profiles
  for update using (id = auth.uid());

-- Regisztrációkor automatikusan létrejön a profil.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Kutyák és gazdáik ------------------------------------------------------------

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed text,
  sex text check (sex in ('kan', 'szuka')),
  birth_date date,
  chip_number text,
  notes text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.pet_members (
  pet_id uuid not null references public.pets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (pet_id, user_id)
);

create index pet_members_user_idx on public.pet_members (user_id);

-- security definer, hogy az RLS szabályokon belül hívva ne fusson végtelen körbe.
create function public.is_pet_member(p_pet_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.pet_members
    where pet_id = p_pet_id and user_id = auth.uid()
  );
$$;

create function public.is_pet_owner(p_pet_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.pet_members
    where pet_id = p_pet_id and user_id = auth.uid() and role = 'owner'
  );
$$;

alter table public.pets enable row level security;
alter table public.pet_members enable row level security;

create policy "Gazdák látják a kutyát" on public.pets
  for select using (public.is_pet_member(id));
create policy "Gazdák módosíthatják a kutyát" on public.pets
  for update using (public.is_pet_member(id));
create policy "Tulajdonos törölheti a kutyát" on public.pets
  for delete using (public.is_pet_owner(id));

create policy "Gazdák látják a társgazdákat" on public.pet_members
  for select using (public.is_pet_member(pet_id));
create policy "Kilépés vagy társgazda eltávolítása" on public.pet_members
  for delete using (user_id = auth.uid() or public.is_pet_owner(pet_id));

-- Új kutya felvétele: a létrehozó automatikusan tulajdonos lesz.
create function public.create_pet(
  p_name text,
  p_breed text default null,
  p_sex text default null,
  p_birth_date date default null,
  p_chip_number text default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Nincs bejelentkezve';
  end if;
  insert into public.pets (name, breed, sex, birth_date, chip_number, created_by)
  values (p_name, p_breed, p_sex, p_birth_date, p_chip_number, auth.uid())
  returning id into v_id;
  insert into public.pet_members (pet_id, user_id, role)
  values (v_id, auth.uid(), 'owner');
  return v_id;
end;
$$;

-- Társgazda hozzáadása e-mail cím alapján (a meghívottnak már regisztrálnia kell).
create function public.add_pet_member(p_pet_id uuid, p_email text)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid;
begin
  if not public.is_pet_member(p_pet_id) then
    raise exception 'Nincs jogosultság';
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    return 'nincs_ilyen_felhasznalo';
  end if;
  insert into public.pet_members (pet_id, user_id, role)
  values (p_pet_id, v_user, 'member')
  on conflict do nothing;
  return 'ok';
end;
$$;

-- Társgazdák listája nevekkel (a profilok egyébként csak a saját gazdinak láthatók).
create function public.pet_member_list(p_pet_id uuid)
returns table (user_id uuid, full_name text, email text, role text)
language sql
stable
security definer set search_path = ''
as $$
  select m.user_id, p.full_name, p.email, m.role
  from public.pet_members m
  join public.profiles p on p.id = m.user_id
  where m.pet_id = p_pet_id and public.is_pet_member(p_pet_id)
  order by m.created_at;
$$;

-- Adatlap táblák -----------------------------------------------------------------

create table public.weights (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric(5, 2) not null check (weight_kg > 0),
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.allergies (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  name text not null,
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.conditions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  name text not null,
  diagnosed_on date,
  active boolean not null default true,
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.vets (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  name text not null,
  clinic text,
  specialty text,
  phone text,
  email text,
  address text,
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  vaccinated_on date not null,
  vaccine text not null,
  product_name text,
  valid_until date,
  vet_id uuid references public.vets (id) on delete set null,
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.medical_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  event_date date not null,
  kind text not null default 'egyeb'
    check (kind in ('mutet', 'vizsgalat', 'kezeles', 'egyeb')),
  title text not null,
  vet_id uuid references public.vets (id) on delete set null,
  description text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index weights_pet_idx on public.weights (pet_id, measured_on);
create index allergies_pet_idx on public.allergies (pet_id);
create index conditions_pet_idx on public.conditions (pet_id);
create index vets_pet_idx on public.vets (pet_id);
create index vaccinations_pet_idx on public.vaccinations (pet_id, vaccinated_on);
create index medical_events_pet_idx on public.medical_events (pet_id, event_date);

-- Ugyanaz a szabály minden kutyához tartozó táblára: csak a gazdák férnek hozzá.
do $$
declare
  t text;
begin
  foreach t in array array['weights', 'allergies', 'conditions', 'vets', 'vaccinations', 'medical_events']
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
