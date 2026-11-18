create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant usage on schema auth to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
create table public.gallery_posts(id uuid primary key default gen_random_uuid(),author_id uuid not null references auth.users(id) on delete cascade,nickname text not null,title text not null,body text not null,image_path text not null,created_at timestamptz not null default now());
alter table public.gallery_posts enable row level security;
grant select on public.gallery_posts to anon,authenticated;
grant insert(author_id,nickname,title,body,image_path),delete on public.gallery_posts to authenticated;
create policy read_post on public.gallery_posts for select to anon,authenticated using(true);
create policy insert_post on public.gallery_posts for insert to authenticated with check(author_id=auth.uid());
create policy delete_post on public.gallery_posts for delete to authenticated using(author_id=auth.uid());
insert into auth.users values ('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222');
-- Existing post gets backfilled exactly once.
insert into public.gallery_posts(id,author_id,nickname,title,body,image_path) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','one','existing','body','one.jpg');
