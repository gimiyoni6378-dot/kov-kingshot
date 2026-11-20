-- Existing projects: run this entire file in Supabase SQL Editor.
-- Preserve historical posts; enforce the new limits on new/updated rows.
begin;
alter table public.gallery_posts
  drop constraint if exists gallery_posts_title_check,
  drop constraint if exists gallery_posts_body_check;
alter table public.gallery_posts
  add constraint gallery_posts_title_check
    check (char_length(trim(title)) between 1 and 50) not valid,
  add constraint gallery_posts_body_check
    check (char_length(trim(body)) between 1 and 1000) not valid;
commit;
