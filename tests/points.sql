-- Local disposable PostgreSQL only; bootstrap first. Never run on production.
set role authenticated;
set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';
do $$ begin
 if (public.kov_my_activity()->>'points')::int <> 10 then raise exception 'Backfill wrong';end if;
 if not public.kov_check_in() then raise exception 'First check-in missing';end if;
 if public.kov_check_in() then raise exception 'Duplicate check-in awarded';end if;
 if (public.kov_my_activity()->>'points')::int <> 11 then raise exception 'Attendance total wrong';end if;
 if (public.kov_my_activity()->>'checked_in')::boolean is not true then raise exception 'Today status wrong';end if;
 if public.kov_my_activity()->>'today' <> (now() at time zone 'Asia/Seoul')::date::text then raise exception 'KST day wrong';end if;
 begin
  insert into public.point_events(user_id,event_key,kind,delta) values(auth.uid(),'fake','post',10);
  raise exception 'Ledger insert allowed';
 exception when insufficient_privilege then null;end;
 begin
  update public.point_events set delta=10000;
  raise exception 'Ledger update allowed';
 exception when insufficient_privilege then null;end;
 begin
  delete from public.point_events;
  raise exception 'Ledger delete allowed';
 exception when insufficient_privilege then null;end;
 begin
  insert into public.gallery_comments(post_id,author_id,nickname,body) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','22222222-2222-2222-2222-222222222222','spoof','spoof');
  raise exception 'Author spoof allowed';
 exception when insufficient_privilege then null;end;
end $$;
insert into public.gallery_posts(author_id,nickname,title,body,image_path) values(auth.uid(),'one','new','body','new.jpg');
-- ID is generated, because clients cannot supply it (or created_at).
insert into public.gallery_comments(post_id,author_id,nickname,body) values((select id from public.gallery_posts where image_path='new.jpg'),auth.uid(),'one','mine');
do $$ begin
 if (public.kov_my_activity()->>'points')::int <> 22 then raise exception 'Content points wrong';end if;
end $$;
set request.jwt.claim.sub='22222222-2222-2222-2222-222222222222';
insert into public.gallery_comments(post_id,author_id,nickname,body) values((select id from public.gallery_posts where image_path='new.jpg'),auth.uid(),'two','another member');
do $$ declare n int;begin
 if (select count(*) from public.point_events)<>1 then raise exception 'Cross-user ledger leaked';end if;
 delete from public.gallery_posts where id=(select id from public.gallery_posts where image_path='new.jpg');get diagnostics n=row_count;
 if n<>0 then raise exception 'Other member deleted post';end if;
 delete from public.gallery_comments where author_id<>auth.uid();get diagnostics n=row_count;
 if n<>0 then raise exception 'Other member deleted comment';end if;
 if (public.kov_my_activity()->>'points')::int<>1 then raise exception 'Comment reward missing';end if;
end $$;
set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';
delete from public.gallery_posts where id=(select id from public.gallery_posts where image_path='new.jpg');
do $$ begin
 if (public.kov_my_activity()->>'points')::int<>11 then raise exception 'Cascade reversal wrong';end if;
 if (public.kov_my_activity()->>'comments')::int<>0 then raise exception 'Comments not cascaded';end if;
end $$;
set request.jwt.claim.sub='22222222-2222-2222-2222-222222222222';
do $$ begin
 if (public.kov_my_activity()->>'points')::int<>0 then raise exception 'Other member cascade reversal missing';end if;
end $$;
reset role;
set request.jwt.claim.sub='';
set role anon;
do $$ begin
 begin perform public.kov_check_in();raise exception 'Anonymous check-in allowed';exception when insufficient_privilege then null;end;
 begin perform public.kov_my_activity();raise exception 'Anonymous summary allowed';exception when insufficient_privilege then null;end;
 begin perform * from public.point_events;raise exception 'Anonymous ledger read allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- Account deletion must not fail due to award reversal triggers.
delete from auth.users where id='22222222-2222-2222-2222-222222222222';
select 'PASS: awards, reversals, own-only access, immutable ledger, authentication, KST attendance' as result;
