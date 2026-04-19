-- Create the storage bucket expected by ProfilePictureUpload.tsx
-- Bucket name is hardcoded as: profile-pictures

insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do update set public = excluded.public;

-- Allow signed-in users to upload into their own folder: <uid>/avatar-...
drop policy if exists "Profile photos: upload own folder" on storage.objects;
create policy "Profile photos: upload own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update files in their own folder
drop policy if exists "Profile photos: update own folder" on storage.objects;
create policy "Profile photos: update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete files in their own folder
drop policy if exists "Profile photos: delete own folder" on storage.objects;
create policy "Profile photos: delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read so getPublicUrl() works in the UI
drop policy if exists "Profile photos: public read" on storage.objects;
create policy "Profile photos: public read"
on storage.objects
for select
to public
using (bucket_id = 'profile-pictures');
