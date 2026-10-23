-- Kutyafotó az avatar helyén. A fotók nyilvános tárolóba kerülnek véletlen
-- névvel (így a böngésző gyorsítótárazhatja őket); feltölteni és törölni csak
-- a kutya gazdái tudnak.

alter table public.pets add column photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-photos', 'pet-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Gazdák látják a kutyafotókat" on storage.objects
  for select to authenticated
  using (bucket_id = 'pet-photos' and public.is_pet_member(((storage.foldername(name))[1])::uuid));
create policy "Gazdák feltölthetnek kutyafotót" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pet-photos' and public.is_pet_member(((storage.foldername(name))[1])::uuid));
create policy "Gazdák törölhetnek kutyafotót" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pet-photos' and public.is_pet_member(((storage.foldername(name))[1])::uuid));
