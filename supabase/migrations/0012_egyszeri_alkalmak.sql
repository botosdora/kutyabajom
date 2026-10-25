-- Egyszeri (alkalmankénti) gyógyszerek több dátummal: egy új alkalom nem írja
-- felül a korábbit. A start_date a legkorábbi alkalom marad (a lekérdezési
-- tartományhoz), a többi nap a once_dates tömbben van.

alter table public.medications add column once_dates date[] not null default '{}';

update public.medications set once_dates = array[start_date] where schedule_type = 'once';

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
      when m.interval_days is null then d.day = m.start_date or d.day = any (m.once_dates)
      else (d.day - m.start_date) % m.interval_days = 0
    end
  order by 6, 2;
$$;
