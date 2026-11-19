-- New comments:1P. Existing awards stay unchanged. Run after 002 (and003 if used).
-- This is the final points migration; do not rerun002/003 afterward without005.
begin;
alter table public.point_events drop constraint if exists point_event_amount;
alter table public.point_events add constraint point_event_amount check (
 (kind='post' and delta=10) or (kind='post_deleted' and delta=-10)
 or (kind='comment' and delta in (1,10))
 or (kind='comment_deleted' and delta in (-1,-10))
 or (kind='attendance' and delta=1)
 or (kind='defense' and delta in (30,40,50,100))
);
create or replace function public.kov_award_content_points() returns trigger
language plpgsql security definer set search_path='' as $$
declare activity text; amount integer;
begin
 activity:=case when TG_TABLE_NAME='gallery_posts' then 'post' else 'comment' end;
 amount:=case when activity='comment' then 1 else 10 end;
 if TG_OP='INSERT' then
  insert into public.point_events(user_id,event_key,kind,delta)
  values(new.author_id,activity||':'||new.id::text,activity,amount)
  on conflict(user_id,event_key) do nothing;
  return new;
 end if;
 -- Reverse the ORIGINAL award: old10P comments lose10P, new1P comments lose1P.
 if exists(select 1 from auth.users where id=old.author_id) then
  insert into public.point_events(user_id,event_key,kind,delta)
  select old.author_id,activity||'-deleted:'||old.id::text,activity||'_deleted',-e.delta
  from public.point_events e where e.user_id=old.author_id
   and e.event_key=activity||':'||old.id::text and e.kind=activity and e.delta>0
  on conflict(user_id,event_key) do nothing;
 end if;
 return old;
end $$;
revoke all on function public.kov_award_content_points() from public,anon,authenticated;
commit;
