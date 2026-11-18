-- Run after gallery.sql and 002-points.sql. Safe to rerun.
begin;
alter table public.point_events drop constraint if exists point_events_kind_check;
alter table public.point_events add constraint point_events_kind_check check(kind in ('post','comment','attendance','post_deleted','comment_deleted','defense'));
alter table public.point_events drop constraint if exists point_event_amount;
alter table public.point_events add constraint point_event_amount check(
 (kind in ('post','comment') and delta=10) or (kind='attendance' and delta=1)
 or (kind in ('post_deleted','comment_deleted') and delta=-10)
 or (kind='defense' and delta in (30,40,50,100)));
create table if not exists public.defense_runs(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 finished_at timestamptz,
 cleared integer check(cleared between 0 and 10),
 points integer check(points in (0,30,40,50,100)),
 version integer not null default 1
);
create index if not exists defense_runs_user on public.defense_runs(user_id,created_at desc);
create unique index if not exists defense_one_active on public.defense_runs(user_id) where finished_at is null;
alter table public.defense_runs enable row level security;
revoke all on public.defense_runs from anon,authenticated;
grant select on public.defense_runs to authenticated,service_role;
drop policy if exists defense_read_own on public.defense_runs;
create policy defense_read_own on public.defense_runs for select to authenticated using(user_id=(select auth.uid()));
create or replace function public.kov_defense_begin() returns jsonb
language plpgsql security definer set search_path='' as $$
declare member uuid:=auth.uid(); run public.defense_runs;
begin
 if member is null then raise exception 'Authentication required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(member::text,0));
 -- Expired sessions can be replaced; unfinished current sessions are reused.
 update public.defense_runs set finished_at=now(),cleared=0,points=0 where user_id=member and finished_at is null and created_at<now()-interval '24 hours';
 insert into public.defense_runs(user_id) values(member) on conflict(user_id) where finished_at is null do nothing;
 select * into run from public.defense_runs where user_id=member and finished_at is null;
 return jsonb_build_object('id',run.id,'version',run.version);
end $$;
revoke all on function public.kov_defense_begin() from public,anon,authenticated;
grant execute on function public.kov_defense_begin() to authenticated;
-- ONLY the authenticated Edge Function's service role may call this RPC.
create or replace function public.kov_defense_finish(p_run uuid,p_member uuid,p_cleared integer,p_ticks integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare run public.defense_runs; award integer; total bigint;
begin
 select * into run from public.defense_runs where id=p_run and user_id=p_member for update;
 if not found then raise exception 'Unknown game session'; end if;
 if run.finished_at is null then
  if run.created_at<now()-interval '24 hours' then raise exception 'Game session expired'; end if;
  if p_cleared is null or p_cleared not between 0 and 10 or p_ticks is null or p_ticks<0 or p_ticks>360000 then raise exception 'Invalid game result'; end if;
  if extract(epoch from now()-run.created_at)+5 < p_ticks/120.0 then raise exception 'Game finished too quickly'; end if;
  award:=case when p_cleared=10 then 100 when p_cleared=9 then 50 when p_cleared between 6 and 8 then 40 when p_cleared=5 then 30 else 0 end;
  if award>0 then
   insert into public.point_events(user_id,event_key,kind,delta) values(p_member,'defense:'||p_run::text,'defense',award) on conflict(user_id,event_key) do nothing;
  end if;
  update public.defense_runs set finished_at=now(),cleared=p_cleared,points=award where id=p_run returning * into run;
 end if;
 select coalesce(sum(delta),0) into total from public.point_events where user_id=p_member;
 return jsonb_build_object('run_id',run.id,'cleared',run.cleared,'awarded',run.points,'points',total);
end $$;
revoke all on function public.kov_defense_finish(uuid,uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.kov_defense_finish(uuid,uuid,integer,integer) to service_role;
commit;
