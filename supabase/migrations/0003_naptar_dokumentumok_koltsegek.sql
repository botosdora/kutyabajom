-- 3. fázis: naptár (orvosi vizsgálatok és egyéb feladatok), orvosi
-- dokumentumok tárolása, költségek.

-- Feladattípusok (pl. fizioterápia, kutyakozmetika, agility) --------------------

create table public.task_types (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (pet_id, name)
);

-- Naptár események ----------------------------------------------------------------

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  category text not null check (category in ('orvosi', 'feladat')),
  vet_type text check (vet_type in ('vizsgalat', 'oltas', 'vervetel', 'kontroll', 'egyeb')),
  task_type_id uuid references public.task_types (id) on delete set null,
  title text not null,
  event_date date not null,
  event_time time,
  vet_id uuid references public.vets (id) on delete set null,
  location text,
  notes text,
  status text not null default 'planned' check (status in ('planned', 'done', 'missed')),
  completed_on date,
  medical_event_id uuid references public.medical_events (id) on delete set null,
  vaccination_id uuid references public.vaccinations (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index calendar_events_pet_idx on public.calendar_events (pet_id, event_date);

-- Orvosi dokumentumok -------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  title text not null,
  doc_type text not null default 'egyeb'
    check (doc_type in ('labor', 'korlap', 'rontgen', 'ultrahang', 'recept', 'egyeb')),
  document_date date not null default current_date,
  medical_event_id uuid references public.medical_events (id) on delete set null,
  tags text[] not null default '{}',
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index documents_pet_idx on public.documents (pet_id, document_date);

-- A fájlok privát tárolóban, kutyánként külön mappában: <pet_id>/<fájl>.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 20971520)
on conflict (id) do nothing;

create policy "Gazdák olvassák a dokumentumokat" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and public.is_pet_member(((storage.foldername(name))[1])::uuid));
create policy "Gazdák feltölthetnek dokumentumot" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.is_pet_member(((storage.foldername(name))[1])::uuid));
create policy "Gazdák törölhetnek dokumentumot" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.is_pet_member(((storage.foldername(name))[1])::uuid));

-- Költségek -----------------------------------------------------------------------

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  spent_on date not null default current_date,
  category text not null
    check (category in ('allatorvos', 'gyogyszer', 'etel', 'apolas', 'terapia', 'felszereles', 'egyeb')),
  amount_huf integer not null check (amount_huf >= 0),
  title text not null,
  notes text,
  medical_event_id uuid references public.medical_events (id) on delete set null,
  calendar_event_id uuid references public.calendar_events (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index expenses_pet_idx on public.expenses (pet_id, spent_on);

do $$
declare
  t text;
begin
  foreach t in array array['task_types', 'calendar_events', 'documents', 'expenses']
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

-- Minden kiadás egy helyen: a külön rögzített költségek és a gyógyszervásárlások.
-- security_invoker: a lekérdező jogosultságaival fut, így az RLS érvényes.
create view public.all_expenses with (security_invoker = true) as
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
  select
    p.id,
    p.pet_id,
    p.purchased_on,
    'gyogyszer',
    p.cost_huf,
    m.name,
    p.quantity,
    'medication_purchase',
    null,
    p.medication_id
  from public.medication_purchases p
  join public.medications m on m.id = p.medication_id
  where p.cost_huf is not null;
