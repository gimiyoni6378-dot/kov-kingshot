-- Run after 002-points.sql. Public author ranks only; never exposes balances/emails.
begin;
create or replace function public.kov_author_ranks(p_authors uuid[])
returns table(author_id uuid,rank_label text)
language plpgsql stable security definer set search_path='' as $$
begin
 if p_authors is null or cardinality(p_authors)>100 then raise exception 'Request at most 100 authors'; end if;
 return query
 with visible as (
  select distinct p.author_id as member from public.gallery_posts p where p.author_id=any(p_authors)
  union
  select distinct c.author_id from public.gallery_comments c where c.author_id=any(p_authors)
 ), balances as (
  select v.member,greatest(0,coalesce(sum(e.delta),0)) as points
  from visible v left join public.point_events e on e.user_id=v.member group by v.member
 )
 select b.member,case when b.points<3900 then 'Lv.'||least(30,b.points/100+1)::text
  else 'TG'||least(10,(b.points-2900)/1000)::text end
 from balances b;
end $$;
revoke all on function public.kov_author_ranks(uuid[]) from public,anon,authenticated;
grant execute on function public.kov_author_ranks(uuid[]) to anon,authenticated;
comment on function public.kov_author_ranks(uuid[]) is 'Current website rank for visible post/comment authors. LEVEL_STEP=100 TG_STEP=1000; keep aligned with ranks.js.';
commit;
