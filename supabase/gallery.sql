-- Run once in Supabase SQL Editor. Safe to rerun for this gallery's policies.
begin;
create table if not exists public.gallery_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(trim(nickname)) between 1 and 24),
  title text not null check (char_length(trim(title)) between 1 and 50),
  body text not null check (char_length(trim(body)) between 1 and 1000),
  image_path text not null unique,
  created_at timestamptz not null default now(),
  constraint gallery_owned_image check (
    image_path ~ ('^' || author_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$')
  )
);
create index if not exists gallery_posts_recent on public.gallery_posts (created_at desc, id desc);
alter table public.gallery_posts enable row level security;
revoke all on public.gallery_posts from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.gallery_posts to anon, authenticated;
grant insert (author_id,nickname,title,body,image_path), delete on public.gallery_posts to authenticated;
drop policy if exists gallery_read on public.gallery_posts;
create policy gallery_read on public.gallery_posts for select to anon, authenticated using (true);
drop policy if exists gallery_create on public.gallery_posts;
create policy gallery_create on public.gallery_posts for insert to authenticated
  with check ((select auth.uid()) = author_id);
drop policy if exists gallery_delete on public.gallery_posts;
create policy gallery_delete on public.gallery_posts for delete to authenticated
  using ((select auth.uid()) = author_id);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('gallery','gallery',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists gallery_upload on storage.objects;
create policy gallery_upload on storage.objects for insert to authenticated
  with check (bucket_id='gallery' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists gallery_remove on storage.objects;
create policy gallery_remove on storage.objects for delete to authenticated
  using (bucket_id='gallery' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists gallery_select_files on storage.objects;
create policy gallery_select_files on storage.objects for select to authenticated
  using (bucket_id='gallery' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
