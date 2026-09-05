insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('takes-original', 'takes-original', false, 8388608, array['image/jpeg']::text[]),
  ('takes-blur', 'takes-blur', true, 1048576, array['image/jpeg']::text[]),
  ('avatars', 'avatars', true, 524288, array['image/jpeg']::text[])
on conflict (id) do nothing;

create policy takes_original_owner
on storage.objects
for all
to authenticated
using (
  bucket_id = 'takes-original'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'takes-original'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy takes_blur_public_read
on storage.objects
for select
to public
using (bucket_id = 'takes-blur');

create policy takes_blur_owner_write
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'takes-blur'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy takes_blur_owner_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'takes-blur'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'takes-blur'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy takes_blur_owner_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'takes-blur'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy avatars_public_read
on storage.objects
for select
to public
using (bucket_id = 'avatars');

create policy avatars_owner_write
on storage.objects
for all
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
