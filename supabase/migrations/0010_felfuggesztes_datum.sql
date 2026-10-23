-- A felfüggesztés 'infinity' helyett távoli dátummal tilt, mert a Supabase
-- Auth szolgáltatás a végtelen időbélyeget nem tudja beolvasni.

create or replace function public.admin_set_suspended(p_user_id uuid, p_suspended boolean)
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
     set banned_until = case when p_suspended then timestamptz '2999-12-31 00:00:00+00' else null end
   where id = p_user_id;
  if p_suspended then
    delete from auth.refresh_tokens where user_id = p_user_id::text;
    delete from public.push_subscriptions where user_id = p_user_id;
  end if;
end;
$$;

update auth.users set banned_until = timestamptz '2999-12-31 00:00:00+00' where banned_until = 'infinity';
