-- KOV points + attendance + comments. Run AFTER gallery.sql. Safe to rerun.
begin;
create table if not exists public.gallery_comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.gallery_posts(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 nickname text not null check (char_length(trim(nickname)) between 1 and 24),
 body text not null check (char_length(trim(body)) between 1 and 1000),
 created_at timestamptz not null default now()
);
create index if not exists gallery_comments_post on public.gallery_comments(post_id,created_at,id);
alter table public.gallery_comments enable row level security;
revoke all on public.gallery_comments from anon,authenticated;
grant select on public.gallery_comments to anon,authenticated;
grant insert(post_id,author_id,nickname,body),delete on public.gallery_comments to authenticated;
drop policy if exists comment_read on public.gallery_comments;
create policy comment_read on public.gallery_comments for select to anon,authenticated using(true);
drop policy if exists comment_insert on public.gallery_comments;
create policy comment_insert on public.gallery_comments for insert to authenticated with check(author_id=(select auth.uid()));
drop policy if exists comment_delete on public.gallery_comments;
create policy comment_delete on public.gallery_comments for delete to authenticated using(author_id=(select auth.uid()));

create table if not exists public.point_events (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null,
 kind text not null check(kind in ('post','comment','attendance','post_deleted','comment_deleted')),
 delta integer not null,
 created_at timestamptz not null default now(),
 unique(user_id,event_key),
 constraint point_event_amount check (
  (kind in ('post','comment') and delta=10) or (kind='attendance' and delta=1)
  or (kind='post_deleted' and delta=-10) or (kind='comment_deleted' and delta=-10)
 )
);
-- Upgrade existing 1P comment awards AND reversals to 10P, without duplication.
alter table public.point_events drop constraint if exists point_event_amount;
update public.point_events set delta=case when kind='comment' then 10 else -10 end
 where kind in ('comment','comment_deleted') and abs(delta)<>10;
alter table public.point_events add constraint point_event_amount check (
 (kind in ('post','comment') and delta=10) or (kind='attendance' and delta=1)
 or (kind in ('post_deleted','comment_deleted') and delta=-10)
);
create index if not exists point_events_member on public.point_events(user_id,created_at desc,id desc);
alter table public.point_events enable row level security;
revoke all on public.point_events from anon,authenticated;
grant select on public.point_events to authenticated;
drop policy if exists points_read_own on public.point_events;
create policy points_read_own on public.point_events for select to authenticated using(user_id=(select auth.uid()));
-- No client INSERT, UPDATE or DELETE grants. Points are awarded by triggers only.
create or replace function public.kov_award_content_points() returns trigger
language plpgsql security definer set search_path='' as $$
declare activity text; amount integer;
begin
 activity := case when TG_TABLE_NAME='gallery_posts' then 'post' else 'comment' end;
 amount := 10;
 if TG_OP='INSERT' then
  insert into public.point_events(user_id,event_key,kind,delta)
  values(new.author_id,activity||':'||new.id::text,activity,amount)
  on conflict(user_id,event_key) do nothing;
  return new;
 end if;
 -- Keep the award and its reversal as history. Skip when the whole account is deleted.
 if exists(select 1 from auth.users where id=old.author_id) then
  insert into public.point_events(user_id,event_key,kind,delta)
  select old.author_id,activity||'-deleted:'||old.id::text,activity||'_deleted',-amount
  where exists(select 1 from public.point_events where user_id=old.author_id and event_key=activity||':'||old.id::text)
  on conflict(user_id,event_key) do nothing;
 end if;
 return old;
end $$;
revoke all on function public.kov_award_content_points() from public,anon,authenticated;
drop trigger if exists kov_post_points on public.gallery_posts;
create trigger kov_post_points after insert or delete on public.gallery_posts
 for each row execute function public.kov_award_content_points();
drop trigger if exists kov_comment_points on public.gallery_comments;
create trigger kov_comment_points after insert or delete on public.gallery_comments
 for each row execute function public.kov_award_content_points();
-- Include existing content exactly once when installing or rerunning this migration.
insert into public.point_events(user_id,event_key,kind,delta,created_at)
 select author_id,'post:'||id::text,'post',10,created_at from public.gallery_posts
 on conflict(user_id,event_key) do nothing;
insert into public.point_events(user_id,event_key,kind,delta,created_at)
 select author_id,'comment:'||id::text,'comment',10,created_at from public.gallery_comments
 on conflict(user_id,event_key) do nothing;

create or replace function public.kov_check_in() returns boolean
language plpgsql security definer set search_path='' as $$
declare member uuid := auth.uid(); affected integer;
begin
 if member is null then raise exception 'Authentication required' using errcode='42501'; end if;
 insert into public.point_events(user_id,event_key,kind,delta)
 values(member,'attendance:'||(now() at time zone 'Asia/Seoul')::date::text,'attendance',1)
 on conflict(user_id,event_key) do nothing;
 get diagnostics affected = row_count;
 return affected=1;
end $$;
revoke all on function public.kov_check_in() from public,anon,authenticated;
grant execute on function public.kov_check_in() to authenticated;

create or replace function public.kov_my_activity() returns jsonb
language plpgsql security definer set search_path='' as $$
declare member uuid := auth.uid(); result jsonb;
begin
 if member is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select jsonb_build_object(
  'points',coalesce((select sum(delta) from public.point_events where user_id=member),0),
  'posts',(select count(*) from public.gallery_posts where author_id=member),
  'comments',(select count(*) from public.gallery_comments where author_id=member),
  'attendance_days',(select count(*) from public.point_events where user_id=member and kind='attendance'),
  'checked_in',exists(select 1 from public.point_events where user_id=member and event_key='attendance:'||(now() at time zone 'Asia/Seoul')::date::text),
  'today',(now() at time zone 'Asia/Seoul')::date
 ) into result;
 return result;
end $$;
revoke all on function public.kov_my_activity() from public,anon,authenticated;
grant execute on function public.kov_my_activity() to authenticated;
commit;
