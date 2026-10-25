-- A korábban felülírt egyszeri alkalmak visszaállítása a már rögzített beadásokból.
update public.medications m
   set once_dates = (
     select array_agg(distinct d order by d)
     from unnest(m.once_dates || array(
       select (l.scheduled_for at time zone 'Europe/Budapest')::date
       from public.dose_logs l where l.medication_id = m.id
     )) d
   ),
   start_date = least(m.start_date, (
     select min((l.scheduled_for at time zone 'Europe/Budapest')::date)
     from public.dose_logs l where l.medication_id = m.id
   ))
 where m.schedule_type = 'once';
