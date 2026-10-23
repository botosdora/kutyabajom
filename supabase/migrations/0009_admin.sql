-- Admin szerepkör: csak az admin küldhet meghívót, láthatja a tárhelyet és
-- kezelheti a felhasználókat (felfüggesztés, törlés). Mások kutyáinak adataiba
-- az admin sem lát bele – az RLS szabályok változatlanok.
--
-- Az admin kijelölése egyszer, kézzel (nem a repóban):
--   update public.profiles set is_admin = true where email = '<admin e-mail>';

alter table public.profiles add column is_admin boolean not null default false;

-- A felhasználó csak a saját beállításait módosíthatja, az is_admin oszlopot nem.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, notifications_enabled, notify_doses, notify_reminders, daily_reminder_time)
  on public.profiles to authenticated;

create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Meghívó: csak admin -------------------------------------------------------------------

drop policy "Saját meghívók" on public.invites;
create policy "Admin kezeli a meghívókat" on public.invites
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.create_invite(p_note text default null)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_code text;
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if not public.is_admin() then
    raise exception 'Meghívót csak az admin készíthet';
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

-- Tárhely: csak admin ---------------------------------------------------------------------

create or replace function public.storage_usage()
returns table (bucket text, files bigint, bytes bigint)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Csak az admin láthatja';
  end if;
  return query
  select o.bucket_id::text, count(*), coalesce(sum((o.metadata ->> 'size')::bigint), 0)::bigint
  from storage.objects o
  where o.bucket_id in ('documents', 'pet-photos')
  group by o.bucket_id;
end;
$$;

-- Felhasználók listája az adminnak (csak fiókadatok, a kutyák adatai nélkül) --------------------

create function public.admin_users()
returns table (
  id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  suspended boolean,
  is_admin boolean,
  pets bigint,
  storage_bytes bigint
)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Csak az admin láthatja';
  end if;
  return query
  select
    u.id,
    p.full_name,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    coalesce(u.banned_until > now(), false),
    coalesce(p.is_admin, false),
    (select count(*) from public.pet_members m where m.user_id = u.id),
    -- A felhasználó kutyáihoz tartozó fájlok mérete (közös kutyánál mindkét gazdánál számít).
    (select coalesce(sum((o.metadata ->> 'size')::bigint), 0)::bigint
       from storage.objects o
      where o.bucket_id in ('documents', 'pet-photos')
        and (storage.foldername(o.name))[1] in (select m.pet_id::text from public.pet_members m where m.user_id = u.id))
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at;
end;
$$;

-- Felfüggesztés: a belépés letiltása (visszavonható), az értesítések leállítása.
create function public.admin_set_suspended(p_user_id uuid, p_suspended boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Csak az admin teheti meg';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Saját magadat nem függesztheted fel';
  end if;
  update auth.users
     set banned_until = case when p_suspended then 'infinity'::timestamptz else null end
   where id = p_user_id;
  if p_suspended then
    delete from auth.refresh_tokens where user_id = p_user_id::text;
    delete from public.push_subscriptions where user_id = p_user_id;
  end if;
end;
$$;

-- Törléshez: a felhasználó azon kutyái, amelyeknek ő az egyetlen gazdája (ezek törlődnek).
create function public.admin_sole_owned_pets(p_user_id uuid)
returns table (pet_id uuid)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Csak az admin láthatja';
  end if;
  return query
  select m.pet_id from public.pet_members m
  where m.user_id = p_user_id
    and not exists (select 1 from public.pet_members o where o.pet_id = m.pet_id and o.user_id <> p_user_id);
end;
$$;

revoke execute on function public.admin_users() from public, anon;
revoke execute on function public.admin_set_suspended(uuid, boolean) from public, anon;
revoke execute on function public.admin_sole_owned_pets(uuid) from public, anon;
revoke execute on function public.storage_usage() from public, anon;
grant execute on function public.admin_users() to authenticated;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;
grant execute on function public.admin_sole_owned_pets(uuid) to authenticated;
grant execute on function public.storage_usage() to authenticated;
