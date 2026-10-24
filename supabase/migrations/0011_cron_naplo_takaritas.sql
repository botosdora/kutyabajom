-- A percenkénti értesítés-időzítő minden futását a pg_cron naplózza
-- (cron.job_run_details), és ez magától nem törlődik: kb. 1 MB naponta.
-- Naponta egyszer töröljük a 7 napnál régebbi bejegyzéseket.

select cron.schedule(
  'kutyabajom-cron-naplo-takaritas',
  '17 3 * * *',
  $cron$ delete from cron.job_run_details where end_time < now() - interval '7 days' $cron$
);
