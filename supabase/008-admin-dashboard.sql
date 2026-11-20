-- Run after 002-points.sql. Safe to rerun. Set YOUR_LOGIN_EMAIL below before running. No user UID is required.
begin;
create table if not exists public.kov_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.kov_admins enable row level security;
revoke all on public.kov_admins from public,anon,authenticated;
create or replace function public.kov_is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.kov_admins where user_id=auth.uid());
$$;
revoke all on function public.kov_is_admin() from public,anon,authenticated;
grant execute on function public.kov_is_admin() to authenticated;

create or replace function public.kov_admin_members(p_query text default '',p_page integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; needle text:=left(trim(coalesce(p_query,'')),100); page_index integer:=greatest(0,least(coalesce(p_page,0),100000));
begin
 if not public.kov_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 with balances as (
  select e.user_id,sum(e.delta) as points from public.point_events e group by e.user_id
 ), members as (
  select u.id,left(coalesce(nullif(trim(u.raw_user_meta_data->>'nickname'),''),'KOV 멤버'),24) as nickname,
   u.email,u.created_at,u.last_sign_in_at,coalesce(b.points,0) as points
  from auth.users u left join balances b on b.user_id=u.id where coalesce(u.email,'')<>''
 ), filtered as (
  select m.* from members m where needle='' or position(lower(needle) in lower(m.nickname||' '||m.email))>0
 ), paged as (
  select f.*,case when greatest(0,f.points)<3900 then 'Lv.'||least(30,greatest(0,f.points)/100+1)::text
   else 'TG'||least(10,(greatest(0,f.points)-2900)/1000)::text end as rank_label
  from filtered f order by f.created_at desc,f.id desc limit 25 offset page_index*25
 )
 select jsonb_build_object(
  'members',coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at desc,p.id desc) from paged p),'[]'::jsonb),
  'total',(select count(*) from filtered),
  'stats',jsonb_build_object('members',(select count(*) from members),'points',(select coalesce(sum(points),0) from members),
   'recent',(select count(*) from members where created_at>=now()-interval '7 days'))
 ) into result;
 return result;
end $$;
revoke all on function public.kov_admin_members(text,integer) from public,anon,authenticated;
grant execute on function public.kov_admin_members(text,integer) to authenticated;

-- Preserve owner deletion and add admin deletion. No extra read access to auth.users.
drop policy if exists gallery_delete on public.gallery_posts;
create policy gallery_delete on public.gallery_posts for delete to authenticated
 using(author_id=(select auth.uid()) or (select public.kov_is_admin()));
drop policy if exists gallery_admin_remove on storage.objects;
create policy gallery_admin_remove on storage.objects for delete to authenticated
 using(bucket_id='gallery' and (select public.kov_is_admin()));
drop policy if exists gallery_admin_select_files on storage.objects;
create policy gallery_admin_select_files on storage.objects for select to authenticated
 using(bucket_id='gallery' and (select public.kov_is_admin()));
-- Replace YOUR_LOGIN_EMAIL with the email you use to sign in to the KOV site.
-- This setup runs in SQL Editor only; the website cannot assign admin roles.
do $$
declare
 owner_email text := 'YOUR_LOGIN_EMAIL';
 owner_id uuid;
begin
 if owner_email='YOUR_LOGIN_EMAIL' or trim(owner_email)='' then
  raise exception 'Replace YOUR_LOGIN_EMAIL with your KOV login email before running this query.';
 end if;
 begin
  select u.id into strict owner_id from auth.users u
   where lower(u.email)=lower(trim(owner_email));
 exception
  when no_data_found then
   raise exception 'No account matches this email. Check Authentication > Users in the current project.';
  when too_many_rows then
   raise exception 'Multiple accounts match this email. No administrator was assigned.';
 end;
 insert into public.kov_admins(user_id) values(owner_id) on conflict(user_id) do nothing;
end $$;
commit;
